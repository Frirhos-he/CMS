'use strict';

/* Data Access Object (DAO) module for accessing pages data */

const db = require('./db');

/*
* API: contents
*/

// This function retrieves the whole list of contents by pageid from the database.
// Not used
exports.getContentsByPageId = (pageid) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM contents WHERE pageid = ? ORDER BY position ASC';
    db.all(sql, [pageid], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

  

// This function adds a new content specific to a pageid
exports.createContent = (content, pageid) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO contents (pageid, type, text, position) VALUES (?, ?, ?, ?)';
    db.run(sql, [pageid, content.type, content.text, content.position], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();   //return nothing in case of success
      }
    });
  });
};

exports.updateContent = (content) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE contents SET text = ?, position = ? WHERE id = ?';

    db.run(sql, [content.text,content.position, content.id], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(); // Return nothing in case of success
      }
    });
  });
};
exports.deleteContent = (contentid) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM contents WHERE id = ?';
    db.run(sql, [contentid], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();  //return nothing in case of success
      }
    });
  });
};
  
// This function remove all the contents associated with a specific pageid
exports.deleteContentsByPageId = (pageid) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM contents WHERE pageid = ?';
    db.run(sql, [pageid], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();  //return nothing in case of success
      }
    });
  });
};



