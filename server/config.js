/**
 * @type {String} appURL should match your browser's address bar.
 * For debugging it may be helpful to provide a localhost URL
 * This config works in a mixed environment with dotcloud or local Node, also should work with NodeJitsu
 * If you're using NodeJitsu then you can leave this as is unless you want to use a custom URL.
 */

var config_couchURL = process.env.COUCH_URL;
var config_appURL = (process.env.NODE_ENV == 'production') ? 'http://'+process.env.SUBDOMAIN+'.jit.su' : 'http://localhost:8080';
var config_verbosity = 0;
var config_redis_host = process.env.REDIS_HOST;
var config_redis_port = process.env.REDIS_PORT;
var config_redis_key = process.env.REDIS_KEY;
var config_loggly = null;


var fs = require('fs');
fs.readFile('/home/dotcloud/environment.json', 'utf8', function (err,data) {
    if (err) {
        return console.log(err);
    } else {
        console.log(data);
        var env = JSON.parse(data);
        config_appURL = env['DOTCLOUD_WWW_HTTP_URL'];
        config_couchURL = env['COUCH_URL'];
        config_redis_host = env['DOTCLOUD_DATA_REDIS_HOST'];
        config_redis_port = env['DOTCLOUD_DATA_REDIS_PORT'];
        config_redis_key = env['DOTCLOUD_DATA_REDIS_PASSWORD'];
    }
});
/*
 separated out config variables to make it easier to specify mixed use cases, defaults defined for a native node installation
 */
module.exports = {
    appURL: config_appURL,
    couchURL: config_couchURL,
    verbosity: config_verbosity,
    redis: {
        host: config_redis_host,
        port: config_redis_port, //9859 = default redis port, use 6379 for iris
        key: config_redis_key
    },
    loggly: config_loggly
}