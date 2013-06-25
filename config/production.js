/**
 * @type {String} appURL should match your browser's address bar.
 * For debugging it may be helpful to provide a localhost URL.
 * If you're using DotCloud you can leave this as is unless you want to use a custom URL.
 */
var fs = require('fs');
var env = JSON.parse(fs.readFileSync('/home/dotcloud/environment.json', 'utf-8'));
console.log(env);

module.exports = {
    appURUL : env['DOTCLOUD_WWW_HTTP_URL'],
    couchURL : env['COUCH_URL'],
    verbosity : 0,
    redis : {
        host : env['DOTCLOUD_DATA_REDIS_HOST'],
        port : env['DOTCLOUD_DATA_REDIS_PORT'],
        key : env['DOTCLOUD_DATA_REDIS_PASSWORD']
    },
    loggly : null,
    port : 8080,
    cacheType : 1,
    dev : 0
}