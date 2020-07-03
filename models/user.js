const mongoose = require('mongoose');
const passportMongoose = require('passport-local-mongoose');
const mongooseBcrypt = require('mongoose-bcrypt');

//Setup the schema to declare how information of the User is Stored in the MongoDB.
const userSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: 'First Name is Required',
    trim: true,
    max: 30,
  },

  surname: {
    type: String,
    required: 'surname is required',
    trim: true,
    max: 30,
  },

  email: {
    type: String,
    required: 'Email address is required',
    trim: true,
    unique: true,
    lowercase: true,
  },

  password: {
    type: String,
    required: 'Password is required',
    bcrypt: true, // Set BCRYTPT to Hash and Salt the Password.
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

userSchema.plugin(mongooseBcrypt);
userSchema.plugin(passportMongoose, { usernameField: 'email' });

module.exports = mongoose.model('User', userSchema);
