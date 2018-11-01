'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);

describe.only('Noteful API - Users', function () {
  const username = 'exampleUser';
  const password = 'examplePass';
  const fullname = 'Example User';

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return User.createIndexes();
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });
  
  describe('/api/users', function () {
    describe('POST', function () {
      it('Should create a new user', function () {
        const testUser = { username, password, fullname };

        let res;
        return chai
          .request(app)
          .post('/api/users')
          .send(testUser)
          .then(_res => {
            res = _res;
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('id', 'username', 'fullname');

            expect(res.body.id).to.exist;
            expect(res.body.username).to.equal(testUser.username);
            expect(res.body.fullname).to.equal(testUser.fullname);

            return User.findOne({ username });
          })
          .then(user => {
            expect(user).to.exist;
            expect(user.id).to.equal(res.body.id);
            expect(user.fullname).to.equal(testUser.fullname);
            return user.validatePassword(password);
          })
          .then(isValid => {
            expect(isValid).to.be.true;
          });
      });

      it('Should reject users with missing username', function () {
        let res;
        const testUser = { password, fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(_res => {
            res = _res;
            expect(res).to.have.status(422);
            expect(res.body.message).to.include.string(`Missing 'username' in request body`);
            return User.find({ username});
          })
          .then(results => {
            expect(results).to.be.an('array').empty;
          });
      });

      it('Should reject users with missing password', function(){
        let res;
        const testUser = { username, fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(_res => {
            res = _res;
            expect(res).to.have.status(422);
            expect(res.body.message).to.include.string(`Missing 'password' in request body`);
            return User.find({ username});
          })
          .then(results => {
            expect(results).to.be.an('array').empty;
          });
      });

      it('Should reject users with non-string username', function() {
        let res;
        const testUser = { username: [username] , password, fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(_res => {
            res = _res;
            expect(res).to.have.status(422);
            expect(res.body.message).to.include.string('Incorrect field type: expected string');
            return User.find({ username});
          })
          .then(results => {
            expect(results).to.be.an('array').empty;
          });

      });

      it('Should reject users with non-string password', function(){
        let res;
        const testUser = { username , password: [password], fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(_res => {
            res = _res;
            expect(res).to.have.status(422);
            expect(res.body.message).to.include.string('Incorrect field type: expected string');
            return User.find({ username});
          })
          .then(results => {
            expect(results).to.be.an('array').empty;
          });
      });

      it('Should reject users with non-trimmed username', function(){
        let res;
        const testUser = { username: '     exampleuser' , password, fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(_res => {
            res = _res;
            expect(res).to.have.status(422);
            expect(res.body.message).to.include.string('Cannot start or end with whitespace');
            return User.find({ username});
          })
          .then(results => {
            expect(results).to.be.an('array').empty;
          });
      });

      it('Should reject users with non-trimmed password', function(){
        let res;
        const testUser = { username , password: '     password', fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(_res => {
            res = _res;
            expect(res).to.have.status(422);
            expect(res.body.message).to.include.string('Cannot start or end with whitespace');
            return User.find({ username});
          })
          .then(results => {
            expect(results).to.be.an('array').empty;
          });
      });

      it('Should reject users with empty username',function(){
        let res;
        const testUser = { username: '' , password, fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(_res => {
            res = _res;
            expect(res).to.have.status(422);
            expect(res.body.message).to.include.string('Must be at least 1 characters long');
            return User.find({ username});
          })
          .then(results => {
            expect(results).to.be.an('array').empty;
          });
      });
      it('Should reject users with password less than 8 characters', function(){
        let res;
        const testUser = { username, password: 'abc', fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(_res => {
            res = _res;
            expect(res).to.have.status(422);
            expect(res.body.message).to.include.string('Must be at least 8 characters long');
            return User.find({ username});
          })
          .then(results => {
            expect(results).to.be.an('array').empty;
          });
      });
      it('Should reject users with password greater than 72 characters', function(){
        let res;
        const testUser = { username, password: 'asdfghjklaasdfghjklaasdfghjklaasdfghjklaasdfghjklaasdfghjklaasdfghjklaasdfghjkla', fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(_res => {
            res = _res;
            expect(res).to.have.status(422);
            expect(res.body.message).to.include.string('Must be at most 72 characters long');
            return User.find({ username});
          })
          .then(results => {
            expect(results).to.be.an('array').empty;
          });
      });
      it('Should reject users with duplicate username', function(){
        const testUser = { username, password, fullname };
        const dupeUser = { username, password, fullname: 'another name' };
        let res;
        return chai.request(app)
          .post('/api/users')
          .send(testUser)
          .then(_res => {
            res = _res;
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('id', 'username', 'fullname');

            expect(res.body.id).to.exist;
            expect(res.body.username).to.equal(testUser.username);
            expect(res.body.fullname).to.equal(testUser.fullname);
            return chai.request(app).post('/api/users').send(dupeUser);
          })
          .then(results => {
            expect(results).to.have.status(400);
            expect(results.body.message).to.include.string('The username already exists');
          });
      });

      it('Should trim fullname', function(){
        const testUser = { username, password, fullname:'     example name' };
        let res;
        return chai.request(app)
          .post('/api/users')
          .send(testUser)
          .then(_res => {
            res = _res;
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('id', 'username', 'fullname');
            expect(res.body.id).to.exist;
            expect(res.body.username).to.equal(testUser.username);
            expect(res.body.fullname).to.equal(testUser.fullname);
          });
      });
    });
  });
});