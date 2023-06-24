'use strict';

/* Data Access Object (DAO) module for accessing pages data */

const db = require('./db');

/*
* API: title
*/

// This function retrieves the whole list of pages from the database.
exports.getTitle = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT title FROM titles;';
    db.get(sql, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// This function updates an existing title given its title
exports.updateTitle = (title) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE titles SET title = ?;';
    db.run(sql, [title], function (err) {
      if (err) {
        reject(err);
        return;
      }
      if (this.changes !== 1) {
        resolve({ error: 'No title was updated.' });
        return;
      }
      resolve(exports.getTitle());
    });
  })
};
  


