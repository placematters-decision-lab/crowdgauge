/**
 * @type {String} appURL should match your browser's address bar.
 * For debugging it may be helpful to provide a localhost URL.
 * If you're using NodeJitsu then you can leave this as is unless you want to use a custom URL.
 */
module.exports.port = process.env.PORT || 80;

var _isLocal = function () {
    return process.env.NODE_ENV === 'localhost';
};
var _ifLocal = function (localVal, serverVal) {
    if (_isLocal()) return localVal;
    return serverVal;
};
module.exports.ifLocal = _ifLocal;
module.exports.doIfLocal = function (localFn, serverFn) {
    if (_isLocal()) {
        if (localFn) localFn();
    } else {
        if (serverFn) serverFn();
    }
};

//--the appURL is required by persona authentication. It must match the URL that the user sees in their browser. .
module.exports.appURL = _ifLocal('http://127.0.0.1:' + module.exports.port, process.env.APP_URL);

module.exports.couchURL = process.env.COUCH_URL;
module.exports.verbosity = 0;
module.exports.cacheType = process.env.CACHE_TYPE || 1;// REDIS:0,MEMCACHE:1,NONDISTRIBUTED:2  --- @see distCache cacheTypes
module.exports.loggly = null;
//module.exports.loggly = {
//    conf:{ subdomain:'yourdomain' },

//    key:'your-key'
//};
