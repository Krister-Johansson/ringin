var express = require('express');
var passport = require('passport');
var user = require('../models/user');
var tenant = require('../lib/tenant');
var router = express.Router();

function getAuthorizedTenants (req) {
  if (req.user) {
    return req.user.permissions;
  }
}

router.get('/register', function(req, res) {
    res.render('register');
});

router.post('/register', passport.authenticate('local-signup', {
        successRedirect : '/login',
        failureRedirect : '/register',
        failureFlash : {type:'warning'}
    }));

router.get('/login', tenant.setCurrent(), function(req, res) {
    res.render('login');
});

router.post('/login', passport.authenticate('local-login', {
        failureRedirect : '/login',
        failureFlash : {type:'warning'}
    }), function(req, res){
        res.redirect('/dashboard');
    });

router.get('/logout', function(req, res) {
    req.logout();
    var url = 'http://' + req.tenant + '.' + req.get('host') + '/';
    res.redirect(url);
});

module.exports = router;