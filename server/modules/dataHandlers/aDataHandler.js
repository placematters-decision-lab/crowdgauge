//region includes
var url = require('url');

//endregion
var config = require("../../config");
var nano = require('nano')(config.couchURL);

//region includes
//constants
/**
 @class ADataHandler
 */
ADataHandler = function (dbName) {
    var _self = this;
//region private fields and methods
    var _dbName = dbName;
    var _db = nano.db.use(_dbName);

    var _createDb = function (callback) {
        nano.db.create(_dbName, function (err) {
            //do we need to call 'use' again???
            if (!err && callback) callback();
        });
    };

    var _deleteAllResults = function (body, callback) {
        if (body && body.rows && body.rows.length > 0) {
            body.rows.forEach(function (row, i) {
                var doc = row.value;
                _db.destroy(doc._id, doc._rev, function (err, body) {
                    if (callback) callback(!err);
                });
            });
        }
    };

    var _returnJsonObj = function (res, obj) {
        res.writeHeader(200, {"Content-Type": "application/json"});
        res.write(JSON.stringify(obj));
        res.end();
    };

    var _returnResults = function (res, body, fn) {
        if (!(body && body.rows)) {
            _returnJsonObj(res, []);
            return;
        }
        _returnJsonObj(res, body.rows.map(function (row) {
            if (fn) return fn(row.value);
            return row.value;
        }));
    };

    var _returnBasicSuccess = function (res) {
        _returnJsonObj(res, {success:true});
    };

    var _returnBasicFailure = function (res, message) {
        _returnJsonObj(res, {success:false, message:message});
    };
//endregion

//region protected methods
    this.p_db = _db;

    /**
     * @param {Object} doc
     * @param {String} docId
     * @param {Function} callback
     * @param {Boolean} [dontCreateDb]
     */
    this.p_addOrUpdate = function (doc, docId, callback, dontCreateDb) {
        var db = _self.p_db;
        if (docId) {
            db.head(docId, function (err, _, headers) {
                if (err) {
                    //probably a 404 in which case we don't need a 'revision'
                } else {
                    doc._rev = JSON.parse(headers.etag);
                }
                db.insert(doc, docId, function (err, res) {
                    if (err) {
                        if (err.reason == 'no_db_file' && !dontCreateDb) {
                            _createDb(function () {
                                _self.p_addOrUpdate(doc, docId, callback, true);//avoid infinite loop if creation fails
                            });
                        } else {
                            console.log("ERROR: problem adding doc: " + err.description);
                        }
                    }
                    if (callback) callback();
                });
            });
        } else {
            db.insert(doc, null, function (err, res) {
                if (err) console.log("ERROR: problem adding doc: " + err.description);
                if (callback) callback();
            });
        }
    };

    this.p_view = function (view_name, params, callback) {
        _db.view('views', view_name, params, callback);
    };

    this.p_createViews = function (views) {
        this.p_addOrUpdate(views, '_design/views');
    };

    this.p_returnResults = function (res, body, fn) {
        _returnResults(res, body, fn);
    };

    this.p_returnJsonObj = function (res, obj) {
        res.writeHeader(200, {"Content-Type": "application/json"});
        res.write(JSON.stringify(obj));
        res.end();
    };

    this.p_returnBasicSuccess = function (res) {
        _returnBasicSuccess(res);
    };

    this.p_returnBasicFailure = function (res, message) {
        _returnBasicFailure(res, message);
    };

    this.p_deleteAllResults = function (body, callback) {
        _deleteAllResults(body, callback);
    };

    this.p_getQuery = function (req) {
        var url_parts = url.parse(req.url, true);
        return url_parts.query;
    };

    this.p_getUID = function () {
        var msSince2012 = new Date().getTime()-1325376000000;
        return msSince2012 + "-" + Math.floor(Math.random()*10000);
    };
//endregion
};

exports.ADataHandler = ADataHandler;



