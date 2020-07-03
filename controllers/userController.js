const User = require('../models/user');
const Passport = require('passport');

//Express Validator
const { check, validationResult } = require('express-validator');

exports.signUpGet = (req, res) => {
  res.render('sign_up', { title: 'Sign me Up!' });
};

exports.signUpPost = [
  // Validate Userdata, so it doesnt store nested objects or malicious code in the database
  check('first_name')
    .isLength({ min: 1 })
    .withMessage('First Name must be specified.')
    .isAlphanumeric()
    .withMessage('First Name must be Alphanumeric'),

  check('surname')
    .isLength({ min: 1 })
    .withMessage('Surname must be specified.')
    .isAlphanumeric()
    .withMessage('Surname must be Alphanumeric'),

  check('email').isEmail().withMessage('Invalid E-Mail Address'),

  check('confirm_email')
    .custom((value, { req }) => value === req.body.email)
    .withMessage('E-Mail does not match!'),

  check('password')
    .isLength({ min: 6 })
    .withMessage('Password must be min. 6 characters!'),

  check('confirm_password')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match!'),

  check('*').trim().escape(),

  // Check for Errors or Missing fields before passing on to the Login function.
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // ReRender the Signup form if there are errors, show error via title
      res.render('sign_up', {
        title: 'Please fix the Errors:',
        errors: errors.array(),
      });
    } else {
      // if no errors in the data, proceed to register the user. If there are errors, log in the console.
      const newUser = new User(req.body);
      User.register(newUser, req.body.password, function (err) {
        if (err) {
          console.log('error while registering!', err);
          return next(err);
        }
         //Login the user after registering.
        next();
      });
    }
  },
];

// Render login page
exports.loginGet = (req, res) => {
  res.render('login', { title: 'Login' });
};

// Use the passport module to authenticate user
exports.loginPost = Passport.authenticate('local', {
  // Success - Redirect to Homepage and Show success message
  successRedirect: '/',
  successFlash: 'You are now logged in',
  // Fail - Redirect to Login page and display failure message
  failureRedirect: '/login',
  failureFlash: 'Login Failed, try again',
});

// Logout the user by just requesting the .logout function wich is globally available in the session
exports.logout = (req, res) => {
  req.logout();
  req.flash('info', 'You are now Logged out.');
  res.redirect('/');
};

// check for admin status in the Database.
exports.isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    next();
    return;
  }
  req.flash('danger', 'You are not an Admin.');
  res.redirect('/');
};
