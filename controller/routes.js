const express = require('express');
const router = express.Router();
const user = require('../model/user');
const bcryptjs = require('bcryptjs');
const passport = require('passport');
require('./passportLocal')(passport);
require('./googleAuth')(passport);
// This function wil check weather user is authenticated or not
function checkAuth(req, res, next) {
  if (req.isAuthenticated()) {
    res.set(
      'Cache-Control',
      'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0'
    );
    next();
  } else {
    req.flash('error_messages', 'Please Login to continue !');
    res.redirect('/login');
  }
}
// Render index.html
router.get('/', (req, res) => {
  //load user page if authenticated
  if (req.isAuthenticated()) {
    res.render('index', { logged: true });
  } else {
    // Load signin registeration page if not authenticated
    res.render('index', { logged: false });
  }
});
// Registeration page
router.get('/signup', (req, res) => {
  //Load sigup.ejs
  res.render('signup', { csrfToken: req.csrfToken() });
});
// LOgin page
router.get('/login', (req, res) => {
  // LOad login.ejs
  res.render('login', { csrfToken: req.csrfToken() });
});
// Post the login detatils of the user and authenticate using passport.js and create a session for user
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    failureRedirect: '/login',
    successRedirect: '/profile',
    failureFlash: true,
  })(req, res, next);
});
// Destroy the sesion when click on logout button
router.get('/logout', (req, res) => {
  req.logout();
  req.session.destroy(function (err) {
    res.redirect('/');
  });
});
// Register the user in the database by taking input from registeration form
router.post('/signup', (req, res) => {
  //get all the values from form
  const { email, username, password, confirmpassword } = req.body;
  // check weather all the fields are empty or not
  if (!email || !username || !password || !confirmpassword) {
    res.render('signup', {
      err: 'All Fields Required !',
      csrfToken: req.csrfToken(),
    });
  }
  // Check if password is matching
  else if (password != confirmpassword) {
    res.render('signup', {
      err: "Password Don't Match !",
      csrfToken: req.csrfToken(),
    });
  } else {
    // check if username or email already exist in the database
    user.findOne(
      { $or: [{ email: email }, { username: username }] },
      function (err, data) {
        if (err) throw err;
        if (data) {
          // if exist the throw the erro
          res.render('signup', {
            err: 'User Exists, Try Logging In !',
            csrfToken: req.csrfToken(),
          });
        }
        //if not exist then..
        else {
          // USed bycrypt to encrpt the password
          bcryptjs.genSalt(12, (err, salt) => {
            if (err) throw err;
            bcryptjs.hash(password, salt, (err, hash) => {
              if (err) throw err;
              // register the user by saving details in the database
              user({
                username: username,
                email: email,
                password: hash,
                googleId: null,
                provider: 'email',
              }).save((err, data) => {
                if (err) throw err;
                // redirect to login page affter succesfull registeration
                res.redirect('/login');
              });
            });
          });
        }
      }
    );
  }
});
// Load this request if user click on continue with google option
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
// Callback function for the google registeration
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/profile');
  }
);
// profile page of the user after succesfully login
router.get('/profile', checkAuth, (req, res) => {
  // return the username to profile.ejs page
  res.render('profile', {
    username: req.user.username,
    verified: req.user.isVerified,
  });
});

module.exports = router;
