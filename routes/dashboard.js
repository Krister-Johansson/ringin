var express = require('express');
var router = express.Router();

/* GET user profile. */
router.get('/', function(req, res) {
    var tenants = req.user.permissions.map(tenant => {
        var isActive = tenant.tenant === req.tenant;
        console.log(tenant);
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

module.exports = router;
