'use strict';

const express = require('express');
const mongoose = require('mongoose');

const User = require('../models/user');

const router = express.Router();


router.post('/', (req, res, next) => {
  const { username, fullname, password } = req.body;

  const newUser = { username, fullname, password };

  /***** Never trust users - validate input *****/
  return User.find({ username })
    .count()
    .then(count => {
      if(count >0) {
        return Promise.reject({
          code: 422,
          reason:'ValidationError',
          message: 'Username already taken',
          location: 'username'
        });
      }
      return User.create(newUser);
    })
    .then(user => {
      return res.location(`/api/user/${user.id}`).status(201).json(user);
    })
    .catch(err => {
      if (err.reason === 'ValidationError'){
        return res.status(err.code).json(err);
      }
      res.status(500).json({ code: 500, message: 'Internal server error' });
    });

});

module.exports = router;