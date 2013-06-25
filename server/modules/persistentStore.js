//region node.js core
var util = require('util');
//endregion
//region npm modules
var redis = require('redis');
//endregion
//region modules
var config = require('config');

//redis.debug_mode = true;
//endregion
/**
 * @param {Function} [onReady]
 * @constructor
 */
var PersistentStore = function (onReady) {
    var _self = this;

    //region private fields and methods
    var _client;
    var _onReady = onReady;

    var _init = function () {
        _client = redis.createClient(config.redis.port, config.redis.host);
        _client.auth(config.redis.key, function (err) {
            if (err) {
                throw err;
            }
            // You are now connected to your redis.
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
        _client.hgetall(key, function (err, obj) {
            //console.dir(obj);
            callback(obj);
        });
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
        _load(key, callback);
    };

    this.save = function (key, dict, callback) {
        console.log("redis save: " + key + ": " + util.inspect(dict));
        _client.hmset(key, dict, function () {
            if (callback) callback();
        });
    };
    //==============
    this.checkAuthorization = function (req, callback) {
        var cookies = _parseCookies(req);
        if (cookies.email && cookies.auth) {
            //check redis store for this auth and cookie combo
            _load(cookies.email, function (obj) {
                if (obj && obj.auth == cookies.auth) {
                    callback(true);
                } else {
                    callback(false);
                }
            })
        } else {
            callback(false);
        }
    };
    //endregion

    _init();
};

module.exports.PersistentStore = PersistentStore;

