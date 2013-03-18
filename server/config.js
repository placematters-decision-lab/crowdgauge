/**
 * @type {String} appURL should match your browser's address bar.
 * For debugging it may be helpful to provide a localhost URL.
 * If you're using DotCloud you can leave this as is unless you want to use a custom URL.
 */
var fs = require('fs');

fs.exists('/home/dotcloud/environment.json', function(exists) {
    if (exists) {
        var env = JSON.parse(fs.readFileSync('/home/dotcloud/environment.json', 'utf-8'));
        module.exports.appURL = (env['DOTCLOUD_FLAVOR'] == 'sandbox') ? env['DOTCLOUD_WWW_HTTP_URL'] : 'http://localhost:8080';
        module.exports.couchURL = env['COUCH_URL'];
        module.exports.verbosity = 0;
        module.exports.redis = {
            host:env['DOTCLOUD_DATA_REDIS_HOST'],
            port:env['DOTCLOUD_DATA_REDIS_PORT'], //9859 = default redis port, use 6379 for iris
            key:env['DOTCLOUD_DATA_REDIS_PASSWORD']
        };
        module.exports.loggly = null;
//module.exports.loggly = {
//    conf:{ subdomain:'yourdomain' },
//    key:'your-key'
//};

    } else {
        module.exports.appURL = (process.env.NODE_ENV == 'production') ? 'http://'+process.env.SUBDOMAIN+'.jit.su' : 'http://localhost:8080';
        module.exports.couchURL = process.env.COUCH_URL;
        module.exports.verbosity = 0;
        module.exports.redis = {
            host:process.env.REDIS_HOST,
            port:process.env.REDIS_PORT, //9859 = default redis port, use 6379 for iris
            key:process.env.REDIS_KEY
        };
        module.exports.loggly = null;
//module.exports.loggly = {
//    conf:{ subdomain:'yourdomain' },
//    key:'your-key'
//};
    }
});

