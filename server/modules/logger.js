var loggly = require('loggly');
var config = require('../config');

var logglyClient = null;
if (config.loggly) logglyClient = loggly.createClient(config.loggly.conf);

var verbose = config.verbosity;

/**
 * @param {String} msg
 * @param {Number} [verbosity] an optional argument for the level of logging (0 = always log (errors and warnings), 1 = generally helpful debug info, 2 = temp (for a particular test), 3 = very verbose debugging)
 */
exports.log = function (msg, verbosity) {
    if (verbosity && verbosity > verbose) return;//don't log messages whose verbosity is greater than the current setting
    console.log(msg);
    if (logglyClient) logglyClient.log(config.loggly.key, msg);
};