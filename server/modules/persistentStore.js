//region node.js core
var util = require('util');
//endregion
//region npm modules
//endregion
//region modules
var config = require('config');
var dc = require('./core/distCache');

//redis.debug_mode = true;
//endregion
/**
 * @param {Function} [onReady]
 * @constructor
 */
var PersistentStore = function (prefix, onReady) {
    var _self = this;

    //region private fields and methods
    var _distCache;
    var _client;
    var _prefix = prefix || process.env.APP_URL;
    var _onReady = onReady;

    var _init = function () {
//        _distCache = new dc.DistCache(dc.cacheTypes.REDIS, function() {
        _distCache = new dc.DistCache(config.cacheType, function() {
            if (_onReady) _onReady();
        });
    };

    var _parseCookies = function (req) {
        var cookies = {};
        req.headers.cookie && req.headers.cookie.split(';').forEach(function (cookie) {
            var parts = cookie.split('=');
            cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
        });
        return cookies;
    };

    var _makeCookieArr = function (valObj) {
        var vals = [];
        Object.keys(valObj).forEach(function (k) {
            var val = valObj[k];
            vals.push(k + "=" + val);
        });
        return vals;
    };

    var _load = function (key, callback) {
        _distCache.get(_prefix + key, callback);
    };
    //endregion

    //region public API
    //==============COOKIES============
    this.setCookie = function (res, valObj) {
        res.setHeader("Set-Cookie", _makeCookieArr(valObj));
    };
    this.parseCookies = function (req) {
        return _parseCookies(req);
    };
    //================
    this.load = function (key, callback) {
        console.log("INSIDE LOAD PUBLIC");
        _load(key, callback);
    };

    this.save = function (key, dict, callback) {
        console.log("persist save: " + _prefix + key + ": " + util.inspect(dict));
        _distCache.set(_prefix + key, dict, callback);
    };
    //==============
    this.checkAuthorization = function (req, callback) {
        var cookies = _parseCookies(req);
        console.log("-------------cookies.email: " + cookies.email + " cookies.auth: " + cookies.auth + "---------------");
        if (cookies.email && cookies.auth && cookies.email.indexOf("@placematters.org", cookies.email.length - "@placematters.org".length) !== -1) { // only admin inside Sasaki
            //check redis store for this auth and cookie combo
            _load(cookies.email, function (obj) {
                if (obj && obj.auth == cookies.auth) {
                    callback(true);
                } else {
                    callback(false);
                }
            });
        } else {
            console.log('Authorization failed');
            callback(false);
        }
    };
    //endregion

    _init();
};

module.exports.PersistentStore = PersistentStore;