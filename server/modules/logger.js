var loggly = require('loggly');
var config = require('../config');

var client = loggly.createClient(config.loggly.conf);

var verbose = config.verbosity;

/**
 * @param {String} msg
 * @param {Number} [verbosity] an optional argument for the level of logging (0 = always log (errors and warnings), 1 = generally helpful debug info, 2 = very verbose debugging)
 */
exports.log = function (msg, verbosity) {
    if (verbosity && verbosity > verbose) return;//don't log messages whose verbosity is greater than the current setting
    console.log(msg);
    client.log(config.loggly.key, msg);
};