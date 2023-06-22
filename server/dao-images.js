'use strict';

/* Data Access Object (DAO) module for accessing pages data */

const db = require('./db');

/*
* API: images
*/

// This function is used to retrieve images needed to list urls available in db
exports.getImages = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM images';
    db.all(sql, function (err, rows) {
      if (err) {
        reject(err);
      }
      if (rows == undefined) {
        resolve({error:"Images not found"});
      } else {
      resolve(rows);
    }
    });
  });
};