process.env.NODE_ENV = 'test';
// ********************** Initialize server **********************************

const server = require('../index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

// describe('Server!', () => {
//   // Sample test case given to test / endpoint.
//   it('Returns the default welcome message', done => {
//     chai
//       .request(server)
//       .get('/welcome')
//       .end((err, res) => {
//         expect(res).to.have.status(200);
//         expect(res.body.status).to.equals('success');
//         assert.strictEqual(res.body.message, 'Welcome!');
//         done();
//       });
//   });
// });

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

// ********************************************************************************


// Example Positive Testcase :
// API: /add_user
// Input: {id: 5, name: 'John Doe', dob: '2020-02-20'}
// Expect: res.status == 200 and res.body.message == 'Success'
// Result: This test case should pass and return a status 200 along with a "Success" message.
// Explanation: The testcase will call the /add_user API with the following input
// and expects the API to return a status of 200 along with the "Success" message.


// ------------------- Register -------------------


describe('Testing Register API', () => {
  it('positive : /register', done => {
    chai
      .request(server)
      .post('/register')
      .send({ username: 'JohnDoe', password: 'Abcdefg!' })
      .end((err, res) => {
        expect(res).to.have.status(200); // Expecting a success status code
        res.should.be.html; // Expecting a HTML response
        done();
      });
  });

  it('Negative : /register. Checking invalid username & password', done => {
    chai
      .request(server)
      .post('/register')
      .send({ username: '5', password: 10 })
      .end((err, res) => {
        expect(res).to.have.status(400); // Expecting a failure status code
        res.should.be.html; // Expecting a HTML response
        done();
      });
  });
});


// ------------------- Login -------------------


describe('Testing Login API', () => {
  it('positive : /login', done => {
    chai
      .request(server)
      .post('/login')
      .send({ username: 'JohnDoe', password: 'Abcdefg!' })
      .end((err, res) => {
        expect(res).to.have.status(200); // Expecting a success status code
        res.should.be.html; // Expecting a HTML response
        done();
      });
  });

  it('Negative : /login. Checking invalid username & password', done => {
    chai
      .request(server)
      .post('/login')
      .send({ username: '5', password: 10 })
      .end((err, res) => {
        expect(res).to.have.status(400); // Expecting a failure status code
        res.should.be.html; // Expecting a HTML response
        done();
      });
  });
});



// ------------------- Logout -------------------



  describe('Testing Logout API', () => {
    it('positive : /logout', done => {
      chai
        .request(server)
        .get('/logout')
        .end((err, res) => {
          expect(res).to.have.status(200); // Expecting a success status code
          res.should.be.html; // Expecting a HTML response
          done();
        });
    });
  });


// ------------------- Home -------------------



  describe('Testing Home API', () => {
    it('positive : /', done => {
      chai
        .request(server)
        .get('/')
        .end((err, res) => {
          expect(res).to.have.status(200); // Expecting a success status code
          res.should.be.html; // Expecting a HTML response
          done();
        });
    });
  });



// ------------------- /recipes/:id TESTS -------------------
describe('GET /recipes/:id', () => {
  it('positive : should return 200 & render HTML for an existing recipe', done => {
    chai
      .request(server)
      .get('/recipes/1')            
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        res.should.be.html;      
        done();
      });
  });

  it('negative : should return 500 & error text for a non-existent recipe', done => {
    chai
      .request(server)
      .get('/recipes/999999')    
      .end((err, res) => {
        expect(res).to.have.status(500);
        expect(res.text).to.match(/Error retrieving recipe/);
        done();
      });
  });
});






// Example Negative Testcase :
// API: /add_user
// Input: {id: 5, name: 10, dob: '2020-02-20'}
// Expect: res.status == 400 and res.body.message == 'Invalid input'
// Result: This test case should pass and return a status 400 along with a "Invalid input" message.
// Explanation: The testcase will call the /add_user API with the following invalid inputs
// and expects the API to return a status of 400 along with the "Invalid input" message.
