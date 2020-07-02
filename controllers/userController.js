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

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render('sign_up', {
        title: 'Please fix the Errors:',
        errors: errors.array(),
      });
    } else {
      const newUser = new User(req.body);
      User.register(newUser, req.body.password, function (err) {
        if (err) {
          console.log('error while registering!', err);
          return next(err);
        }
        next(); //Login the user after registering.
      });
    }
  },
];

exports.loginGet = (req, res) => {
  res.render('login', { title: 'Login' });
};

exports.loginPost = Passport.authenticate('local', {
  successRedirect: '/',
  successFlash: 'You are now logged in',
  failureRedirect: '/login',
  failureFlash: 'Login Failed, try again',
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('info', 'You are now Logged out.');
  res.redirect('/');
};

exports.isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    next();
    return;
  }
  req.flash('danger', 'You are not an Admin.');
  res.redirect('/');
};
