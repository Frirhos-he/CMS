'use strict';

/* Data Access Object (DAO) module for accessing users data */

const db = require('./db');
const crypto = require('crypto');


/*
* API: users
*/
// This function is used at log-in time to verify username and password.
exports.getUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE email=?';
    db.get(sql, [email], (err, row) => {
      if (err) {
        reject(err);
      } else if (row === undefined) {
        resolve(false);
      } else {
        const user = {
          id: row.id,
          email: row.email,
          username: row.username,
          role: row.role
        };
        // Check the hashes with an async call, this operation may be CPU-intensive (and we don't want to block the server)
        crypto.scrypt(password, row.salt, 32, function (err, hashedPassword) { // WARN: it is 64 and not 32 (as in the week example) in the DB
          if (err) {
            reject(err);
          }
          if (!crypto.timingSafeEqual(Buffer.from(row.hash, 'hex'), hashedPassword)) {  // WARN: it is hash and not password (as in the week example) in the DB
            resolve(false);
          } else {
            resolve(user);
          }
        });
      }
    });
  });
};


// This function is used at to retrieve infos about user
// Not used yet
exports.getUserById = (userid) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE id=?';
    db.get(sql, [userid], (err, row) => {
      if (err) {
        reject(err);
      } else if (row === undefined) {
        reject('User not found.');  // If the query executes successfully but no row is returned
      } else {
        const user = {    // reformat removing unnecessary properties
          id: row.id,
          authorName: row.authorname,
          role: row.role
        };
        resolve(user);
      }
    });
  });
};

//  This function is used to retrieve infos about users
exports.getUsers = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const users = rows.map(row => ({
          id: row.id,
          username: row.username,
          role: row.role
        }));
        resolve(users);
      }
    });
  });
};
