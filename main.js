require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require("express-session");

var TWITTER_CONSUMER_KEY    = "OnKSjQsmPxpeakaeV8gXhbHrK";
var TWITTER_CONSUMER_SECRET = "ATrSKvVcW0xm84L3gaRt5leVnvleJMcR7rUgiQmOCMTwKbzSEu";
var callbackURL             = "https://upload43.herokuapp.com/twitter/callback";

var passport = require('passport');
var TwitterStrategy   = require('passport-twitter').Strategy;
var sess              = require('express-session');
var BetterMemoryStore = require('session-memory-store')(sess);

passport.use(new TwitterStrategy({
  consumerKey:    TWITTER_CONSUMER_KEY,
  consumerSecret: TWITTER_CONSUMER_SECRET,
  callbackURL:    callbackURL
},
  function(token, tokenSecret, profile, done) {
    done(null, profile);
  }
));

// Serialize and deserialize user information
passport.serializeUser(function(user, callback){
  callback(null, user);
});
passport.deserializeUser(function(object, callback){
  callback(null, object);
});


const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb+srv://harsh:harsh@cluster0.ssoip.mongodb.net/node_crud');
const db = mongoose.connection;
db.on('error', (error) => console.log(error));
db.once("open", () => console.log("connected to the database!"));

app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.use(session({
    secret: 'my secret key',
    saveUninitialized: true,
    resave: false,
})
);

var store = new BetterMemoryStore({ expires: 60 * 60 * 1000, debug: true });
app.use(sess({
  name: 'JSESSION',
  secret: 'MYSECRETISVERYSECRET',
  store:  store,
  resave: true,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
});

app.use(express.static('uploads'));

app.set("view engine", "ejs");

app.use("", require('./routes/routes'));

app.listen(PORT, () => {
    console.log(`server started at http://localhost:${PORT}`);
});