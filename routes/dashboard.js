var express = require('express');
var twilio = require('twilio');
var log4js = require('log4js');

var logger = log4js.getLogger();
var client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
var router = express.Router();

var Group = require('../models/group');
var libTenant = require('../lib/tenant');

/* GET user profile. */
router.get('/', function(req, res) {
    logger.trace('GET dashboard/');

    var tenants = req.user.permissions.map(tenant => {
        var isActive = tenant.tenant === req.tenant;

        return {
            tenant: tenant,
            isActive: isActive,
            url: isActive ? '#' : `http://${tenant}.${process.env.ROOT_DOMAIN}:${process.env.PORT}/user`
        };
    });
    res.render('dashboard', { 
        user: req.user, 
        tenants: tenants,
        currentTenant: req.tenant
    });
});

router.get('/group', function(req, res) {
    logger.trace('GET dashboard/group');

    Group.find({ 'userId' :  req.user.id }, function(err, groups) {
        logger.debug(groups);
        res.render('groupList', { groups: groups });
    });
});

router.get('/group/create',  libTenant.checkRole('admin'), function(req, res) {
    logger.trace('GET dashboard/create');

    client.availablePhoneNumbers('SE').local
    .list({
        voiceEnabled: 'true',
        contains: '+4610',
    })
    .then((data) => {
        var numbers = data.map(number => {
            return {
                number: number.phoneNumber,
                friendly: number.phoneNumber.replace(/\+(\d{2})(\d{2})(\d{7})/, "0$2-$3")
            };
        });

        if(numbers.length === 0){
            logger.fatal('Unable to find number!!!');
        }

        numbers.splice(5, numbers.length -5);

        logger.debug(numbers);

        res.render('groupCreate',{ numbers: numbers });
    }).catch(e => {
        logger.error(e.code, e.message);

        req.flash('danger', e.message);
        res.redirect('/dashboard/group');
    });
});
router.post('/group/create', function(req, res) {
    logger.trace('POST dashboard/create');

    client.api.accounts(req.user.sid)
    .fetch()
    .then((account) => {
        logger.info('Get Account');
        logger.debug(account.sid, account.authToken);

        var userClient = new twilio('AC995a7aac034056137df7317c87fe64ee', '94bfc3a860b5610e71fa6c49747cd9c6'); //new twilio(account.sid, account.authToken);

        if(account.status != 'active'){
            req.flash('danger', 'Your account is suspended');
            return res.redirect('/dashboard/group');
        }

        logger.info('Try to buy number: ', req.body.number);

        userClient.incomingPhoneNumbers
        .create({
            friendlyName: req.body.name,
            voiceUrl: 'http://demo.twilio.com/docs/voice.xml',
            phoneNumber: req.body.number,
        })
        .then((number) => {
            logger.debug(number);

            var newGroup = new Group();
            newGroup.userId = req.user.id;
            newGroup.name = req.body.name;
            newGroup.sid = number.sid;
            newGroup.phoneNumber = number.phoneNumber;

            newGroup.save(function(err) {
                if (err){
                    // TODO: Remove the number!
                    logger.fatal(err);
                    throw err;
                }
                req.flash('success', 'Congratulations you have now created: ' + req.body.name + '(' + req.body.number.replace(/\+(\d{2})(\d{2})(\d{7})/, "0$2-$3") + ')');
                logger.info('Redirect /dashboard/group');
                res.redirect('/dashboard/group');
            });
        }).catch(e => {
            logger.error(e.code, e.message);

            req.flash('danger', e.message);
            res.redirect('/dashboard/group/create');
        });
    }).catch(e => {
        logger.error(e.code, e.message);

        req.flash('danger', e.message);
        res.redirect('/dashboard/group');
    });
    
});

module.exports = router;
