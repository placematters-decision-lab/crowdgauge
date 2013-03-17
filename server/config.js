/**
 * @type {String} appURL should match your browser's address bar.
 * For debugging it may be helpful to provide a localhost URL.
 * If you're using DotCloud you can leave this as is unless you want to use a custom URL.
 */
var fs = require('fs');

var env = JSON.parse(fs.readFileSync('/home/dotcloud/environment.json', 'utf-8'));

module.exports.appURL = (env['DOTCLOUD_FLAVOR'] == 'sandbox') ? env['DOTCLOUD_WWW_HTTP_URL'] : 'http://localhost:8080';
module.exports.couchURL = env['COUCH_URL'];
module.exports.verbosity = 0;
module.exports.redis = {
    host:env['DOTCLOUD_DATA_REDIS_URL'],
    port:env['DOTCLOUD_DATA_REDIS_PORT'], //9859 = default redis port, use 6379 for iris
    key:env['DOTCLOUD_DATA_REDIS_PASSWORD']
};
module.exports.loggly = null;
//module.exports.loggly = {
//    conf:{ subdomain:'yourdomain' },
//    key:'your-key'
//};
