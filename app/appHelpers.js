var express = require('express');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var Promise = require('bluebird');

module.exports.encrypt = function(username, password, cb) {
  new Promise(function(resolve, reject) {
    bcrypt.genSalt(10, function(err, salt) {
      if (err) { reject(err); }
      resolve(salt);
    });
  })
  .then(function(salt) {
    bcrypt.hash(password, salt, function(err, hash) {
      if (err) { reject(err); }
      cb(username, salt, hash);
    });
  });
};

module.exports.auth = function(username, password, correctCombo) {
  var salt = '$2a$10$'+correctCombo.salt;
  var saltyHash = '$2a$10$'+correctCombo.salt+correctCombo.password;
  new Promise(function(resolve, reject) {
    bcrypt.hash(password, salt, function(err, hash) {
      if (err) { reject(err); }
      console.log('USER ENTERED: ', hash, 'STORED: ',saltyHash);
    });
  });
};