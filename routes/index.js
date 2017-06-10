var express = require('express');
var passport = require('passport');
var user = require('../models/user');
var router = express.Router();

router.get('/', function (req, res) {
    res.render('index');
});

module.exports = router;