/**
 * @type {String} appURL should match your browser's address bar.
 * For debugging it may be helpful to provide a localhost URL.
 * These defaults should work on most machines after installing CouchDB and Redis locally
 * Just go to your crowdgauge directory and run npm start
 */

module.exports = {
    appURL : 'http://localhost:8080',
    couchURL : 'http://127.0.0.1:5984',
    verbosity : 0,
    redis : {
        host : '127.0.0.1',
        port : '6379',
        key : ''
    },
    loggly : null,
    port : 8080,
    cacheType : 1,
    dev : 1
}