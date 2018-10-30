'use strict';

const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { JWT_SECRET, JWT_EXPIRY } = config; 

const router = express.Router();

const options = {session: false, failWithError: true};

function createAuthToken (user) {
  return jwt.sign({ user }, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY
  });
}

const localAuth = passport.authenticate('local', options);

router.post('/', localAuth, function(req, res){
  const token = createAuthToken(req.user.toJSON());
  return res.json({ token });
});

module.exports = router;