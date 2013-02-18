/**
 * @type {String} appURL should match your browser's address bar.
 * For debugging it may be helpful to provide a localhost URL.
 * If you're using NodeJitsu then you can leave this as is unless you want to use a custom URL.
 */
module.exports.appURL = (process.env.NODE_ENV == 'production') ? 'http://'+process.env.SUBDOMAIN+'.jit.su' : 'http://desotocg.local';
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
