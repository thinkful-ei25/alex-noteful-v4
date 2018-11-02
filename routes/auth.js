'use strict';

const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRY } =  require('../config');

const router = express.Router();

const options = {session: false, failWithError: true};

function createAuthToken (user) {
  return jwt.sign({ user }, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY
  });
}

const localAuth = passport.authenticate('local', options);

const jwtAuth = passport.authenticate('jwt', options);


router.post('/login', localAuth, function(req, res){
  const authToken = createAuthToken(req.user.toJSON());
  return res.json({ authToken });
});

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  return res.json({ authToken }); 
});

module.exports = router;