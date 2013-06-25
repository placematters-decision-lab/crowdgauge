//region node.js core

//endregion
//region npm modules

//endregion
//region modules
var config = require('config');
var logger = require("../logger");
//endregion

/** @enum {Number} */
cacheTypes = {
    REDIS:1,
    MEMCACHE:2,
    NONDISTRIBUTED:3  //--Useful for testing locally. Can be used on single drones only.
};

/**
 * a wrapper for distributed caches that can talk either redis or memcache
 @class DistCache
 */
DistCache = function (type, onReady) {
    var _self = this;

    //region private fields and methods
//    var _type = type || cacheTypes.NONDISTRIBUTED;
    var _type = type || cacheTypes.MEMCACHE;
    var _onReady = onReady;
    var _redCli;
    var _memCli;
    var _nondist;

    var _get;
    var _set;
    var _appendList;

    var _toArray = function (objArr) {
        var ans = [];
        var isSimpleArr = true;//--make sure this is just an array, not an object that happens to have "0" as one of its keys.
        Object.keys(objArr).forEach(function (k) {
            var isInteger = /^[0-9]+$/.test(k);
            if (!isInteger) isSimpleArr = false;
            if (isSimpleArr) {
                ans.push(objArr[k]);
            }
        });
        return (isSimpleArr) ? ans : objArr;
    };

    var _init = function () {
        console.log("ENTERING DISTCACHE..." + _type);
        if(_type == cacheTypes.NONDISTRIBUTED) {
            console.log("ENTERING NONDISTRIBUTED...");
            if (_nondist) return;//already configured
            _nondist = {};
            _get = function (key, callback) {
                callback(_nondist[key]);
            };
            _set = function (key, val, callback) {
                _nondist[key]=val;
                if(callback) callback();
            };
            if (_onReady) _onReady();
        } else if (_type == cacheTypes.REDIS) {
            console.log("ENTERING REDIS...");

            logger.log('Connecting to REDIS');
            var redis = require('redis');
            //redis.debug_mode = true;//TEMP
            _redCli = redis.createClient(config.redis.port, config.redis.host);
            _redCli.on("error", function (err) {
                //_redCli.end();--seems to throw an error
                console.log("REDIS Error " + err);
                _type = cacheTypes.NONDISTRIBUTED;
                _init();
            });
            _redCli.auth(config.redis.key, function (err) {
                if (err) {
                    console.log("REDIS AUTH ERROR: " + err);
                    throw err;
                }
                // You are now connected to your redis.
                console.log("Connected to redis");
                if (_onReady) _onReady();
            });

            _get = function (key, callback) {
                console.log("INSIDE GET REDIS...");
                //console.log('getting from cache: ' + key);
                _redCli.hgetall(key, function (err, obj) {
                    if (!err) {
                        if (obj && obj[0]) obj = _toArray(obj);//Arrays are stored as hashes with numeric keys - make it back into a true Array object.
                        callback(obj);
                    }
                });
            };

            _set = function (key, val, callback) {
                console.log("INSIDE SET REDIS...");
                //console.log('setting cache: ' + key);
//                if (typeof val !== 'string') {
//                    val = JSON.stringify(val);
//                }
                _redCli.hmset(key, val, function (err) {
                    if (callback) callback();
                });
            };

            _appendList = function (key, val, callback) {
                console.log("INSIDE APPENDLIST REDIS...");
                _redCli.rpush(key, val, function () {
                    if (callback) callback();
                });
            };
        } else {
            console.log("ENTERING MEMCACHE... onReady:"+_onReady);
            var mc = require('mc');
            var util = require("util");
            _memCli = new mc.Client('sasakicache.s95c4z.cfg.use1.cache.amazonaws.com:11211', mc.Adapter.json);// remote url
//            _memCli = new mc.Client('127.0.0.1', mc.Adapter.json);// local url
            var client = _memCli.connect(function () {
                console.log("Connected to memcache");
                console.log("APP_URL: " + process.env.APP_URL);
                if (_onReady) _onReady();
            });

            _get = function (key, callback) {
                if (_onReady) _onReady();
                _memCli.get(key, function (err, response) {
                        if (!err) {
                            console.log("no error, inside _get()");
                            console.log("Got Value: " + util.inspect(response[key])+" for "+key);
                            callback(response[key]);
                        }  else  {
                            console.log("ERROR, INSIDE _GET(): " + util.inspect(err));
                        }
                    }
                );
            };

            _set = function (key, val, callback) { // TODO
                console.log("INSIDE SET MEMCACHE..."+key+" : "+ util.inspect(val));
                var oneDay = 60 * 60 * 24;

                // type classification (object, string)
//                var value = "";
                var value = (typeof val == "object") ? JSON.stringify(val) : val;
//                switch (typeof val) {
//                    case "object":
//                        value = JSON.stringify(val);
//                        break;
//                    case "string":
//                        value = val;
//                        break;
//                    case "number":
//                        value = "number*" + val.toString();
//                        break;
//                }

                _memCli.set(key, value, {flags:0, exptime:oneDay}, function (err, status) {
                    if (!err) {
                        console.log("No error, inside _set()");
                        console.log("STATUS: " + status);
                        if (callback) callback();
                    } else {
                        console.log("ERROR, INSIDE _SET(): " + util.inspect(err));
                    }
                });
            };

            _appendList = function (key, val, callback) {
                _memCli.append(key, val, function (err, status) {
                    //console.log(status);
                    if (err) {
                        if (err == 'NOT_FOUND') {
                            _memCli.add(key, val, function (err, status) {
                                if (!err) {
                                    console.log("MEMCACHE Error " + util.inspect(err));
                                    if (callback) callback();
                                }
                            });
                        }
                        console.log("MEMCACHE Error " + util.inspect(err));
                    } else {
                        if (callback) callback();
                    }
                });
            }

            console.log("end memcache...");
        }
    };

    //endregion

    //region public API
    /**
     * @param {String} key
     * @param {Function} callback
     */
    this.get = function (key, callback) {
        _get(key, callback);
    };

    /**
     * @param {String} key
     * @param {Object} value
     * @param {Function} [callback]
     */
    this.set = function (key, value, callback) {
        _set(key, value, callback);
    };

    this.appendList = function (key, val, callback) {
        _appendList(key, val, callback)
    };

    //endregion

    _init();
};


module.exports.cacheTypes = cacheTypes;
module.exports.DistCache = DistCache;