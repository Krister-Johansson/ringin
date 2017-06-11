var express = require('express');
var log4js = require('log4js');

var router = express.Router();
var logger = log4js.getLogger();

var libTenant = require('../lib/tenant');

function buildTenants (req) {
  logger.trace('buildTenants');
  return req.user.permissions.map(tenant => {
    return {
      name: tenant.tenant,
      url: 'http://' + tenant.tenant + '.' + process.env.ROOT_DOMAIN + ((process.env.PORT != 80)? ':' + process.env.PORT + '/dashboard' : '/dashboard')
    };
  });
}

/* GET tenant chooser page */
router.get('/choose', 
  libTenant.isAuthenticated(), 
  function(req, res, next) {
    logger.trace('GET /choose');
    
    res.render('select_tenant', { 
      user: req.user, 
      tenants: buildTenants(req),
      title: 'Choose a tenant',
      message: "Oh no! I can't figure out where to send you.  Please tell me where you want to go."
    });
  });

/* GET user unauthorized for tenant page */
router.get('/unauthorized', 
  libTenant.isAuthenticated(), 
  function(req, res, next) {
    logger.trace('GET /unauthorized');

    res.render('select_tenant', { 
      user: req.user, 
      tenants: buildTenants(req),
      title: 'Unauthorized',
      message: "Sorry, you're not authorized to access that tenant. Please choose another."
    });
  });

module.exports = router;
