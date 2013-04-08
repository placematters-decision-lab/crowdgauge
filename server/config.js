/**
 * @type {String} appURL should match your browser's address bar.
 * For debugging it may be helpful to provide a localhost URL
 * This config works in a mixed environment with dotcloud or local Node, also should work with NodeJitsu
 * If you're using NodeJitsu then you can leave this as is unless you want to use a custom URL.
 */

var config_couchURL, config_appURL, config_verbosity, config_redis_host, config_redis_port, config_redis_key;
var config_loggly = null;

if(process.env.COUCH_URL) {
    console.log(process.env);
    config_couchURL = process.env.COUCH_URL;
    config_appURL = (process.env.NODE_ENV == 'production') ? 'http://'+process.env.SUBDOMAIN+'.jit.su' : 'http://localhost:8080';
    config_verbosity = 0;
    config_redis_host = process.env.REDIS_HOST;
    config_redis_port = process.env.REDIS_PORT;
    config_redis_key = process.env.REDIS_KEY;
    config_loggly = null;
} else {
    console.log('not defined');
    var fs = require('fs');
    var env = JSON.parse(fs.readFileSync('/home/dotcloud/environment.json', 'utf-8'));
    config_appURL = env['DOTCLOUD_WWW_HTTP_URL'];
    config_couchURL = env['COUCH_URL'];
    config_redis_host = env['DOTCLOUD_DATA_REDIS_HOST'];
    config_redis_port = env['DOTCLOUD_DATA_REDIS_PORT'];
    config_redis_key = env['DOTCLOUD_DATA_REDIS_PASSWORD'];
}
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