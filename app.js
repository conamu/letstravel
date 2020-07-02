require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// mongoDB connection
const mongoose = require('mongoose');
// router
const indexRouter = require('./routes/index');
// sessions
const session = require('express-session');
const mongoStore = require('connect-mongo')(session);
// flash messages
const flash = require('connect-flash');

const app = express();

//Passport Setup
const User = require('./models/user.js');
const passport = require('passport');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(session({
  secret: process.env.SECRET,
  saveUninitialized: false,
  resave: false,
  store: new mongoStore( { mongooseConnection: mongoose.connection } )
}));

//passport config
app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(flash());

// Own Middleware
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.url = req.path;
  res.locals.flash = req.flash();
  next();
});

// Setup Mongoose Connection
mongoose.connect(process.env.DB, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
mongoose.Promise = global.Promise;
mongoose.connection.on('error', (error) => console.error(error.message));

//Default Built App.js code

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
