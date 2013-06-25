/**
 * @type {String} appURL should match your browser's address bar.
 * For debugging it may be helpful to provide a localhost URL.
 */

module.exports = {
    appURL : 'http://localhost:8080',
    couchURL : process.env.COUCH_URL,
    verbosity : 0,
    redis : {
        host : process.env.REDIS_HOST,
        port : process.env.REDIS_PORT,
        key : process.env.REDIS_KEY
    },
    loggly : null,
    port : 8080,
    cacheType : 1,
    dev : 1
}