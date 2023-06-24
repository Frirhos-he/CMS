'use strict';

/* Data Access Object (DAO) module for accessing pages data */

const db = require('./db');
const contentDao = require('./dao-contents'); // module for accessing the pages table in the DB
const dayjs = require('dayjs');
/*
 * API: pages
 */

// This function retrieves the whole list of pages from the database.
exports.getPages = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT p.id,u.id AS authorid,u.username AS author, p.title, p.creationdate, p.publicationdate FROM pages AS p, users AS u WHERE p.authorid = u.id;  ';
    db.all(sql, (err, rows) => {
      if (err) {
        reject(err);
      }
      const pages = rows.map((e) => {
        // WARNING: the database returns only lowercase fields. So, to be compliant with the client-side, we convert "watchdate" to the camelCase version ("watchDate").
        const page = Object.assign({}, e, { creationDate: e.creationdate, publicationDate: e.publicationdate }); // adding camelcase "watchDate"
        delete page.creationdate; // removing lowercase 
        delete page.publicationdate; // removing lowercase
        return page;
      });
      const sortedPages = [...pages].sort(sortByPublicationDate);
      // WARNING: if implemented as if(filters[filter]) returns true also for filter = 'constructor' but then .filterFunction does not exists
      resolve(sortedPages);
    });
  });
};

// This function retrieves the whole list of pages from the database.
exports.getPublicatedPages = () => {
  return new Promise((resolve, reject) => {  //comparison is made based on the lexicographic order 
    const sql = 'SELECT p.id,u.id AS authorid,u.username AS author, p.title, p.creationdate, p.publicationdate FROM pages AS p, users AS u WHERE p.publicationdate!= "" AND p.authorid = u.id AND p.publicationdate <= "'+ dayjs().format("YYYY-MM-DD")+'";';
    db.all(sql, (err, rows) => {
      if (err) {
        reject(err);
      }
      const pages = rows.map((e) => {
        // WARNING: the database returns only lowercase fields. So, to be compliant with the client-side, we convert "watchdate" to the camelCase version ("watchDate").
        const page = Object.assign({}, e, { creationDate: e.creationdate, publicationDate: e.publicationdate }); // adding camelcase "watchDate"
        delete page.creationdate; // removing lowercase 
        delete page.publicationdate; // removing lowercase

        return page;
      });

      const sortedPages = [...pages].sort(sortByPublicationDate);
      resolve(sortedPages);
    });
  });
};

// This function retrieves pages and the associated userid
exports.getPagesByUserId = (userid) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT p.id, u.username AS author, p.title, p.creationdate, p.publicationdate
      FROM pages AS p, users AS u
      WHERE p.authorid = u.id AND u.id = ?;
    `;
    db.all(sql, [userid], (err, rows) => {
      if (err) {
        reject(err);
      } else if (rows.length === 0) {  // lenght of the array 0 thus return []
        resolve({error:"no pages found"});
      } else {
        const pages = rows.map((e) => {
          // WARNING: the database returns only lowercase fields. So, to be compliant with the client-side, we convert "publicationdate" to the camelCase version ("publicationDate").
          const page = Object.assign({}, e, { creationDate: e.creationdate, publicationDate: e.publicationdate }); // adding camelcase "publicationDate"
          delete page.creationdate; // removing lowercase 
          delete page.publicationdate; // removing lowercase
          return page;
        });
        resolve(pages);
      }
    });
  });
};
  
// This function retrieves a page given its id and the associated contents
exports.getPageById = (pageid) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT p.id, u.id AS authorid, p.title, p.creationdate, p.publicationdate
      FROM pages AS p, users AS u
      WHERE p.id = ? AND p.authorid = u.id;
    `;
    db.get(sql, [pageid], (err, page) => {
      if (err) {
        reject(err);
      } else if (page === undefined) {
        resolve({ error: "Page not found" });
      } else {
        const pageObject = {
          id: page.id,
          authorid: page.authorid,
          title: page.title,
          creationDate: page.creationdate,
          publicationDate: page.publicationdate,
          contents: []
        };
        contentDao.getContentsByPageId(page.id)
          .then((contents) => {
            if (contents.length === 0) {
              resolve({ error: "Page has no contents" });
            } else {
              const orderedContentsByPosition = contents.sort((a, b) => a.position - b.position);
              pageObject.contents = orderedContentsByPosition;
              resolve(pageObject);
            }
          })
          .catch((err) => {
            reject(err);
          });
      }
    });
  });
};
  
// This function create a page given its properties, autogenerated id and lastID automatically retrieved from the db
exports.createPage = (page) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO pages (title, authorid, creationDate, publicationDate) VALUES (?, ?, ?, ?)';
    db.run(sql, [page.title, page.authorid, page.creationDate, page.publicationDate], function (err) {
      if (err) {
        reject(err);
        return;
      }
      const pageId = this.lastID; // id of the newly inserted page
      Promise.all(
        page.contents.map((content) => {
          return contentDao.createContent(content, pageId); // Call createContent function for each content
        })
      )
        .then(() => {
          // Fetch the newly created page with contents from the database
          resolve(exports.getPageById(pageId));
        })
        .catch((error) => {
          reject(error);
        });
    });
  });
};



// This function updates an existing page given its id and adding new properties
exports.updatePage = (pageid, page) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE pages SET title = ?, authorid = ?, creationDate = ?, publicationDate = ? WHERE id = ?';
    db.run(sql, [page.title, page.authorid, page.creationDate, page.publicationDate, pageid], function (err) {
      if (err) {
        reject(err);
        return;
      }
      if (this.changes !== 1) {
        resolve({ error: 'No page was updated.' });
        return;
      }
      contentDao.getContentsByPageId(pageid)
            .then((oldContents) => {

              const oldContentsCopy =[...oldContents];


              if (oldContentsCopy.length === 0) {
                resolve({ error: "Page has no contents" });
              } else {
                const newContents = page.contents;

                // Compare old and new contents
                const createPromises = [];
                const updatePromises = [];
                const deletePromises = [];

                // Check for new contents and update existing ones
                newContents.forEach((newContent) => {
                  const foundIndex = oldContentsCopy.findIndex((oldContent) => oldContent.id === newContent.id);

                  if (foundIndex === -1) {
                    // New content, create it
                    createPromises.push(contentDao.createContent(newContent, pageid));
                  } else {
                    // Existing content, update it
                    updatePromises.push(contentDao.updateContent(newContent));
                    // Remove the updated content from the oldContentsCopy array
                    oldContentsCopy.splice(foundIndex, 1);
                  }
                });

                // Delete remaining old contents
                oldContentsCopy.forEach((oldContent) => {
                  deletePromises.push(contentDao.deleteContent(oldContent.id));
                });
                // Perform the necessary operations
                return Promise.all([...createPromises, ...updatePromises, ...deletePromises]);
              }
            })
            .then(() => {
              resolve(exports.getPageById(pageid));  // Return the corrected page
            })
            .catch((error) => {
              reject(error);
            });
    });
  });
};

// This function deletes an existing page given its id.
exports.deletePage = (pageid) => {
  return contentDao.deleteContentsByPageId(pageid)
    .then(() => {
      return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM pages WHERE id = ?';
        db.run(sql, [pageid], function (err) {
          if (err) {
            reject(err);
          }
          if (this.changes !== 1)
            resolve({ error: 'No page deleted.' });
          else
            resolve();
        });
        });
      })
    .catch((error) => {
      reject(error);
    });
};


const sortByPublicationDate = (pageA, pageB) => {
  const dateA = dayjs(pageA.publicationDate);
  const dateB = dayjs(pageB.publicationDate);

  // Handle the case where publicationDate is an empty string
  if (dateA.isValid() && !dateB.isValid()) {
    return -1;
  } else if (!dateA.isValid() && dateB.isValid()) {
    return 1;
  }

  if (dateA.isBefore(dateB)) {
    return -1;
  } else if (dateA.isAfter(dateB)) {
    return 1;
  }

  return 0;
};