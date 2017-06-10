var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var flash = require('connect-flash');

require('dotenv').config()
var User = require('./models/user');

var libTenant = require('./lib/tenant');

var routes = require('./routes/index');
var tenant = require('./routes/tenant');
var dashboard = require('./routes/dashboard');
var routes_auth = require('./routes/passport');


var app = express();
// mongoose
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URL);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

 app.use(session({  
  store: new RedisStore({
    url: process.env.REDIS_URL
  }),
  secret: process.env.REDIS_SECRET,
  resave: false,
  cookie: {
    domain: process.env.ROOT_DOMAIN
  },
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
  if (!req.session) {
    return next(new Error('oh no')) // handle error
  }
  next() // otherwise continue
});

app.use(flash());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
        email = email.toLocaleLowerCase();
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists

        User.findOne({ 'email' :  email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err){
              return done(err);
            }
            
            // if no user is found, return the message
            if (!user){
              return done(null, false, req.flash('warning', 'No user found.'));
            }

            // if the user is found but the password is wrong
            if (!user.validPassword(password)){
              return done(null, false, req.flash('warning', 'Oops! Wrong password.'));
            }
            return done(null, user);
        });
    }));

passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
      email = email.toLocaleLowerCase();
      var tenant = req.body.tenant.toLocaleLowerCase();

      process.nextTick(function() {
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'email' :  email }, function(err, user) {
            // if there are any errors, return the error
            if(err){
              return done(err);
            }
            // check to see if theres already a user with that email
            if (user) {
                return done(null, false, req.flash('warning', 'That email is already taken.'));
            } else {
                var newUser = new User();

                // set the user's local credentials
                newUser.email = email;
                newUser.password = newUser.generateHash(password);

                newUser.permissions.push({
                  tenant: tenant,
                  role: 'admin'
                });

                // save the user
                newUser.save(function(err) {
                    if (err){
                      throw err;
                    }
                    return done(null, newUser, req.flash('success', 'You can now login!'));
                });
              }
          });    
        });
    }));


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.use('/', routes);
app.use('/tenant', tenant);
app.use('/', routes_auth);
app.use('/dashboard',
  libTenant.isAuthenticated(),
  libTenant.setCurrent(),
  libTenant.ensureCurrent(),
  libTenant.ensureUrl(),
  dashboard);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
