'use strict';

const chai = require('chai');
const mongoose = require('mongoose');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');

const app = require('../server');
const User  = require('../models/user');
const { users } = require('../db/data');
const { JWT_SECRET, TEST_MONGODB_URI } = require('../config');

const expect = chai.expect;

chai.use(chaiHttp);

describe ('Noteful API Auth', function(){
  const username = 'exampleUser';
  const password = 'examplePass';
  const fullname = 'Example Example';

  
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI, { useNewUrlParser: true, useCreateIndex : true });
  });

  beforeEach(function () {
    return User.hashPassword(password)
      .then(digest => {
        User.create({
          username,
          password: digest,
          fullname
        });
      });
  });

  afterEach(function () {
    return Promise.all([
      User.deleteMany()
    ]);
  });

  after(function () {
    return mongoose.disconnect();
  });


  describe('/api/login', function(){
    it('should reject requests with no credentials', function() {
      return chai.request(app).post('/api/login')
        .then((res) => {
          expect(res).to.have.status(400);
        });
    });

    it('should reject request with incorrect usernames', function(){
      return chai.request(app).post('/api/login')
        .send({username: 'wrongUser', password})
        .then((res)=>{
          expect(res).to.have.status(401);
        });
    });

    it('should reject requests with incorrect passwords', function(){
      return chai.request(app).post('/api/login')
        .send({username, password: 'wrongPass'})
        .then((res)=> {
          expect(res).to.have.status(401);
        });
    });

    it('should return a valid auth token', function(){
      return chai.request(app).post('/api/login')
        .send({username, password})
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.authToken).to.be.a('string');
          const payload = jwt.verify(res.body.authToken, JWT_SECRET, {algorithm: ['HS256']});
          expect(payload.user).to.include.keys(['username','fullname', 'id']);
          expect(payload.user.username).to.equal(username);
          expect(payload.user.fullname).to.equal(fullname);
        });
    });
  });

  describe('/api/refresh', function(){
    it('should reject requests with no credentials', function(){
      return chai.request(app).post('/api/refresh')
        .then(res =>{
          expect(res).to.have.status(401);
        });
    });

    it('should reject requests with an invalid token', function(){
      const token = jwt.sign({ user: {username, fullname} }, 'wrongSecret', {algorithm: 'HS256', expiresIn: '7d'});

      return chai.request(app).post('/api/refresh')
        .set('Authorization', `Bearer ${token}`)
        .then(res =>{
          expect(res).to.have.status(401);
        });
    });

    // it.only('should reject requests with an expired token', function(){
    //   const token = jwt.sign({ user: {username, fullname} }, JWT_SECRET, {algorithm: 'HS256', expiresIn: Math.floor(Date.now()/1000 - 30)});

    //   return chai.request(app).post('/api/refresh')
    //     .set('Authorization', `Bearer ${token}`)
    //     .then(res =>{
    //       expect(res).to.have.status(401);
    //     });
    // });

    it('should return a valid auth token with a newer expiry date', function(){
      const token = jwt.sign({ user: {username, fullname} }, JWT_SECRET, {algorithm: 'HS256', subject: username, expiresIn: '7d'});
      return chai.request(app).post('/api/refresh')
        .set('Authorization', `Bearer ${token}`)
        .then(res =>{
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.authToken).to.be.a('string');
          const payload = jwt.verify(res.body.authToken, JWT_SECRET, {algorithm: ['HS256']});
          expect(payload.user.username).to.equal(username);
          expect(payload.user.fullname).to.equal(fullname);
        });
    });
  });
});

