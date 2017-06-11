var log4js = require('log4js');
var logger = log4js.getLogger();

function getUrlTenant (req) {
  logger.trace('getUrlTenant');
  var hostParts = req.get('host').split('.');
  if (hostParts.length > 2) {
    return hostParts[0];
  }
}

function getAuthorizedTenants (req) {
  logger.trace('getAuthorizedTenants');
  if (req.user) {
    return req.user.permissions;
  }
}

module.exports = {
  // Attempts to sets req.tenant
  setCurrent: function (predicate) {
    logger.trace('setCurrent');
    logger.debug(predicate);
    return function (req, res, next) {
      // first try the passed predicate
      if (predicate) {
        var value = predicate(req);
        if (value) {
          req.tenant = value;
          return next();
        }
      }

      // then try the URL 
      var urlTenant = getUrlTenant(req);
      if (urlTenant)
      {
        // TODO: Do a lookup to get the right permissions for the tenant!
        req.role = req.user.permissions[0].role;
        req.tenant = urlTenant;
        return next();
      }
      
      // finally check to see if the authenticated user has a single authorized tenant
      var tenants = getAuthorizedTenants(req);

      if (tenants && tenants.length === 1) {
        req.tenant = tenants[0].tenant;
        req.role = tenants[0].role;
      }

      next();
    };
  },

  // Makes sure req.tenant exists
  // and that the current user is authorized to access it;
  // otherwise, redirect to appropriate tenant picker 
  ensureCurrent: function () {
    logger.trace('ensureCurrent');
    return function (req, res, next) {
      if (!req.tenant){
        logger.info('Redirect /tenant/choose');
        return res.redirect('/tenant/choose');
      }
        
      
      var tenants = getAuthorizedTenants(req);
      if (!tenants || !tenants.some(tenant => tenant.tenant === req.tenant)){
        logger.info('Redirect /tenant/unauthorized');
        return res.redirect('/tenant/unauthorized');
      }
      next();
    };
  },

  // If req.tenant exists but there's no tenant in the URL
  // redirect to an equivalent URL with the tenant
  ensureUrl: function () {
    logger.trace('ensureUrl');
    return function (req, res, next) {
      var urlTenant = getUrlTenant(req);

      if (req.tenant && !urlTenant) {
        var url = 'http://' + req.tenant + '.' + req.get('host') + req.originalUrl
        logger.info('Redirect:' + url);
        return res.redirect(url);
      }

      next();
    };
  },

  checkRole: function (role) {
    logger.trace('checkRole', role);
    return function (req, res, next) {
      logger.debug(req.role);
      if(req.role && req.role == role){
        logger.info('User is has the right role');
        next();
      } else{
        logger.info('Redirect /login');
        req.flash('warning', 'You do not have the right user role!');
        res.redirect('/dashboard');
      }
    };
  },

  isAuthenticated: function () {
    logger.trace('isAuthenticated');
    return function (req, res, next) {
      if(req.isAuthenticated()){
        logger.info('User is authenticated');
        next();
      } else{
        logger.info('Redirect /login');
        res.redirect('/login');
      }
    };
  }
};
