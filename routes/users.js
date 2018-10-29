'use strict';

const express = require('express');
const mongoose = require('mongoose');

const User = require('../models/user');

const router = express.Router();


router.post('/', (req, res, next) => {
  const { username, fullname, password } = req.body;

  /***** Never trust users - validate input *****/
  return User.find({ username })
    .then(()=> {
      return User.hashPassword(password)
        .then(digest => {
          const newUser = {
            username,
            fullname,
            password: digest
          };
          return User.create(newUser);
        })
        .then(result => {
          return res.location(`/api/user/${result.id}`).status(201).json(result);
        })
        .catch(err => {
          if (err.code === 11000) {
            err = new Error('The username already exists');
            err.status = 400;
          }
          next(err);
        });
    });
});

module.exports = router;