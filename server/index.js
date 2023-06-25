'use strict'
/*** Importing modules ***/
const express = require('express'); // The core Express module that allows you to create a simple and extensible web server web framework
const morgan = require('morgan');   //  A logging middleware that logs HTTP requests to the console. 
const cors = require('cors');       //  A middleware that enables Cross-Origin Resource Sharing, allowing requests from different origins.
const { check, validationResult } = require('express-validator'); //  A validation middleware that provides functions for validating and sanitizing input data.
const dayjs = require("dayjs");      //dayjs module

const pageDao = require('./dao-pages'); // module for accessing the page table in the DB
//const contentDao = require('./dao-contents'); // module for accessing the contents table in DB
const userDao = require('./dao-users'); // module for accessing the user table in the DB
const imageDao = require('./dao-images');  // module for accessing the images table in the DB
const titleDao = require('./dao-titles');  // module for accessing the titles in the DB

/*** init express and set up the middlewares ***/
const app = express();   // application object app
app.use(morgan('dev'));  // Register a middleware
app.use(express.json()); 

/** Set up and enable Cross-Origin Resource Sharing (CORS) **/
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));

/*** Passport ***/

/** Authentication-related imports **/
const passport = require('passport');                              // authentication middleware
const LocalStrategy = require('passport-local');                   // authentication strategy (username and password)

/** Set up authentication strategy to search in the DB a user with a matching password.
 * The user object will contain other information extracted by the method userDao.getUser (i.e., id, username, name).
 **/
passport.use(new LocalStrategy(async function verify(username, password, callback) {
  const user = await userDao.getUser(username, password);
  if (!user)
    return callback(null, false, 'Incorrect username or password');  
    
  return callback(null, user); // NOTE: user info in the session (all fields returned by userDao.getUser, i.e., id, username, name)
}));

//After enabling sessions, you should decide which info to put into them for generating the cookie
// Serializing in the session the user object given from LocalStrategy(verify).
//Passport takes that user info and stores it internally on req.session.passport
passport.serializeUser(function(user, callback) { // this user is id + username + name + role 
  callback(null, user);
});

// Starting from the data in the session, we extract the current (logged-in) user.
passport.deserializeUser(function(user, callback) { // this user is id + email + name 
  return callback(null, user); // this will be available in req.user
});

/** Creating the session */
const session = require('express-session'); // A session is temporary data interchanged between two or more parties
// express-session stores the session in memory
app.use(session({    // Upon authentication, The server replies to the login HTTP request by creating and sending a cookie (stored into server session storage)
  secret: "shhhhh... it's a secret!",  // it is used to verify the integrity of the session data. It ensures that the session data has not been tampered with by unauthorized parties. SESSIONID
  resave: false, // forces the session to be saved back to the session store, even if thE session was never modified during the request, FALSE
  saveUninitialized: false, // forces a session that is new but not modified to be saved to the store
}));
app.use(passport.authenticate('session'));  // authentication middleware to authenticate users in Express

/** Defining authentication verification middleware **/
//Calls next() to activate the next middleware function
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else{
      return res.status(401).json({ error: 'Not authorized' });
  }
};

app.get('/api/users', isLoggedIn, async (req, res) => {
  try {
    if(!req.hasOwnProperty('user') || req.user.role != "admin")
      return res.status(401).json({error: "user is not admin, cannot get users"})
      const result = await userDao.getUsers();
      res.json(result);
  } catch (err) {
    res.status(500).json(err).end();
  }
});

/*** Users APIs ***/

// POST /api/sessions 
// This route is used for performing login.
//authenticate('local') will look for a username and password field in req.body
app.post('/api/sessions', function(req, res, next) { 
  passport.authenticate('local', (err, user, info) => { 
    if (err)
      return next(err);
    if (!user) {
      // display wrong login messages
      return res.status(401).json({ error: info });
    }
    // success, perform the login and establish a login session
    req.login(user, (err) => {
      if (err)
        return next(err);
      return res.json(req.user);
    });
  })(req, res, next);
});

// GET /api/sessions/current
// This route checks whether the user is logged in or not.
app.get('/api/sessions/current',(req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// DELETE /api/sessions/current
// This route is used for logging out the current user.
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.status(200).json({});
  });
});

/*** Pages APIs ***/

// 1. Retrieve the list of all the available pages.
// GET /api/pages
// This route returns the Pages.
app.get('/api/pages', isLoggedIn // Apply the isLoggedIn middleware
, async (req, res) => {
  try {

    const result = await pageDao.getPages();
    res.json(result);

  } catch (err) {
    res.status(500).json(err);
  }
});
// 2. Retrieve the list of all the available publicated pages.
// GET /api/pages/publicated
// This route returns the Pages.
app.get('/api/pages/publicated', async (req, res) => {
  try {
    const result = await pageDao.getPublicatedPages();
    res.json(result);

  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. Retrieve a page, given its “id”.
// GET /api/pages/<id>
// Given a page id, this route returns the associated page and contents.
app.get('/api/pages/:id', [check('id').isInt({ min: 1 })], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().map(error => error.msg).join(' ')});
    }
    const result = await pageDao.getPageById(req.params.id);
    if (result.error) {
      res.status(404).json(result);
    } else {
      const today = dayjs();
      const publicationDate = dayjs(result.publicationDate);
      if(req?.user || (publicationDate.isValid() && today.isAfter(publicationDate)))
        res.json(result);
      else
      return res.status(401).json({ error: "Cannot retrieve that page" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// 4. Create a new page, by providing all relevant information.
// POST /api/pages/add
// This route adds a new page to the page library.
// add is isLoggedIn
app.post(
  '/api/pages/add',
  isLoggedIn,
  [
    check('title').isLength({ min: 2, max: 160 }),
    check('authorid').isInt({ min: 0 }),
    // only date (first ten chars) and valid ISO
    check('creationDate').isLength({ min: 10, max: 10 }).isISO8601({ strict: true }),
    check('publicationDate')
      .isLength({ min: 10, max: 10 })
      .isISO8601({ strict: true })
      .optional({ checkFalsy: true }),
    check('contents').isArray({ min: 2 })
  ],
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().map(error => error.msg).join(' ')});
    }

    const hasHeader = req.body.contents.some(obj => obj.type === 'header');
    const hasImageOrParagraph = req.body.contents.some(obj => obj.type === 'image' || obj.type === 'paragraph');
    if (hasHeader === false || hasImageOrParagraph === false) {
      return res.status(422).json({ error: "didn't provide the minimum number of blocks" });
    }
    const creationDate = dayjs(req.body.creationDate);
    const publicationDate = req.body.publicationDate ? dayjs(req.body.publicationDate) : '';
    if (publicationDate !== '' && creationDate.isAfter(publicationDate)) {
      return res.status(422).json({ error: 'creation date cannot be after the publication date' });
    }

    const page = {
      title: req.body.title,
      authorid: req.body.authorid,
      creationDate: req.body.creationDate, 
      publicationDate: req.body.publicationDate,
      contents: req.body.contents
    };

    try {
      const result = await pageDao.createPage(page); // NOTE: createPage returns the newly created object
      res.json(result);
    } catch (err) {
      res.status(503).json({ error: `Database error during the creation of a new page: ${err}` });
    }
  }
);

// 5. Update an existing page, by providing all the relevant information
// PUT /api/pages/<id>
// This route allows to modify a page, specifying its id and the necessary data.
app.put(
  '/api/pages/:id',
  isLoggedIn,
  [
    check('title').isLength({ min: 2, max: 160 }),
    check('authorid').isInt({ min: 0 }),
    check('creationDate').isLength({ min: 10, max: 10 }).isISO8601({ strict: true }),
    check('publicationDate').isLength({ min: 10, max: 10 }).isISO8601({ strict: true }).optional({ checkFalsy: true }),
    check('contents').isArray({ min: 2 })
  ],
  async (req, res) => {
    //validation error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().map(error => error.msg).join(' ')});
    }
    // body id == req id
    if (req.body.id != Number(req.params.id)) {
      return res.status(422).json({ error: 'URL and body id mismatch' });
    }
    const resultPage = await pageDao.getPageById(req.params.id);
    if(resultPage.error)
         return res.status(404).json(resultPage);
    if (!req.hasOwnProperty('user') || (req.user.id != resultPage.authorid && req.user.role != "admin")) {
      return res.status(401).json({ error: 'User cannot do this operation' });
    }
    // check if the blocks type match specifications
    const hasHeader = req.body.contents.some(obj => obj.type === 'header');
    const hasImageOrParagraph = req.body.contents.some(obj => obj.type === 'image' || obj.type === 'paragraph');
    if (hasHeader === false || hasImageOrParagraph === false) {
      return res.status(422).json({ error: "didn't provide the minimum number of blocks" });
    }
    // check if the publication date is after the creation date
    const creationDate = dayjs(req.body.creationDate);
    const publicationDate = req.body.publicationDate ? dayjs(req.body.publicationDate) : '';

    if (publicationDate !== '' &&  creationDate.isAfter(publicationDate)) {
      return res.status(422).json({ error: 'creation date cannot be greater than the publication date' });
    }

    const page = {
      title: req.body.title,
      authorid: req.body.authorid,
      creationDate: req.body.creationDate, 
      publicationDate: req.body.publicationDate,
      contents: req.body.contents
    };
    try {
      const pageChecked = await pageDao.getPageById(req.params.id);
      if (pageChecked.error)
        return res.status(404).json(pageChecked);
      const result = await pageDao.updatePage(req.params.id, page); // NOTE: updatePage returns the newly updated object
      res.status(200).json(result);
    } catch (err) {
      res.status(503).json({ error: `Database error during the creation of the updated page: ${err}` });
    }
  }
);

// 6. Delete an existing page, given its "id"
// DELETE /api/pages/<id>
// Given a page id, this route deletes the associated page.
app.delete(
  '/api/pages/:id',
  isLoggedIn,
  [check('id').isInt({min:1}),],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ error: errors.array().map(error => error.msg).join(' ')});
      }
      const resultPage = await pageDao.getPageById(req.params.id);
      if(resultPage.error)
           return res.status(404).json(resultPage);

      if (!req.hasOwnProperty('user') || (req.user.id != resultPage.authorid && req.user.role != "admin")) {
        return res.status(401).json({ error: 'User cannot do this operation' });
      }
      // If there is no page with the specified id, the delete operation is considered successful.
      const result = await pageDao.deletePage(req.params.id);
      return res.status(200).json({});

    } catch (err) {
      res.status(503).json({ error: `Database error during the deletion of page ${req.params.id}: ${err} ` });
    }
  }
);

/*** Images APIs ***/

// 1. Retrieve images.
// GET /api/images/
app.get('/api/images', async (req, res) => {
  try {
    const result = await imageDao.getImages();
    res.json(result);
  } catch (err) {
    res.status(500).json(err).end(); 
  }
});

/*** Title APIs  ***/
// 1. Update the title, by providing all the relevant information
// PUT /api/titles
app.put(
  '/api/titles',
  isLoggedIn,
  [
    check('title').isLength({ min: 2, max: 160 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().map(error => error.msg).join(' ')});
    }
    try {
      if ( !req.hasOwnProperty('user') || req.user.role != "admin") {
        return res.status(401).json({ error: 'User cannot do this operation' });
      }
      const result = await titleDao.updateTitle(req.body.title); // NOTE: updatePage returns the newly updated object
      if (result.error) {
        res.status(404).json(result);
      } else {
      res.json(result); 
      }
    } catch (err) {
      res.status(503).json({ error: `Database error during the creation of the updated title: ${err}` });
    }
  }
);

// 2. Get the title
// GET /api/titles

app.get(
  '/api/titles',
  async (req, res) => {
   try {
      const result = await titleDao.getTitle(); // NOTE: updatePage returns the newly updated object
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json(err).end(); 
    }
  }
);

// Activating the server
const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`)); // starts the server on the specified port
