//region nodejs core
var fs = require("fs");
var url = require('url');
//endregion
//region dependencies

//endregion
//region modules
if(process.env.NODE_ENV == 'production') {
    var config = require("../../config");
} else {
    var config = require("../../config.development");
}
var logger = require("./../logger");
var aDataHandler = require('./aDataHandler');
//endregion

/**
 @class ImageDataHandler
 @extends ADataHandler
 */
ImageDataHandler = function () {
    var _self = this;

    aDataHandler.ADataHandler.call(this, 'images_nrv');

    /** @type {Object.<string, Array.<Function>>} a queue of functions to execute as revisions are made (to avoid conflicts)*/
    var _queuedDocActions = {};
    var _latestRevIds = {};

    var _init = function () {
        _createViews();
    };

    var _createViews = function () {
        _self.p_createViews({
            "views": {
                "byFilename": {
                    "map": function (doc) {
                        if (doc.filename) emit(doc.filename, doc._id);
                    }
                },
                "byGroup": {
                    "map": function (doc) {
                        if (doc.groupId) emit(doc.groupId, doc);
                    }
                },
                "byGroupByFilename": {
                    "map": function (doc) {
                        if (doc.groupId && doc.filename) emit([doc.groupId, doc.filename], doc);
                    }
                }
            }
        });
    };

    function _logResponse(err, body) {
        if (err) {
            logger.log("error: " + err.description);
        } else {
            logger.log(body);
        }
    }

    /**
     * @param {String} docId
     * @param {Function(string)} fn
     * @private
     */
    var _withLatestRev = function (docId, fn) {
        if (!_queuedDocActions[docId]) _queuedDocActions[docId] = [];
        if (_latestRevIds[docId]) {//the latest revId will be available if the queue was empty (and we didn't use it already)
            var revId = _latestRevIds[docId];
            fn(revId);
            delete _latestRevIds[docId];
        } else {//--no revId has been returned yet. so we need to add this to the queue and wait for a new revId to come back
            _queuedDocActions[docId].push(fn);
        }
//            images_db.head(docId, function (err, _, headers) {
//                if (err) {
//                    console.log("error getting head: " + err);
//                } else {
//                    //todo figure out how to get latest revision id for update since this 'head' call can happen simultaneously and the same ID may be returned twice
//                    var revId = JSON.parse(headers.etag);
//                    _latestRev[docId] = revId;
//                    fn(revId);
//                }
//            });

    };

    var _deleteFile = function (groupId, filename, callback) {
        _self.p_view('byGroupByFilename', {"key": [groupId, filename]}, function (err, body) {
            if (!err) {
                _self.p_deleteAllResults(body, callback);
            } else {
                console.log("Problem removing image: " + err.description);
                callback(false);
            }
        });
    };

    var _updateRevision = function (docId, revId) {
        var arr = _queuedDocActions[docId];
        //if there is something in the queue, call it and pass in this revId.
        //if nothing is queued, then stored this as the next available revId to use.
        if (arr && arr.length > 0) {
            arr.shift()(revId);//remove the first element (and execute that function)
        } else {
            _latestRevIds[docId] = revId;
        }
    };

    var _saveAttachment = function (docId, version, contentType, path, callback) {
        logger.log("_saveAttachment for: " + docId);
        fs.readFile(path, function (err, data) {
            if (!err) {
                //console.log("get head for: " + docId);
                _withLatestRev(docId, function (revId) {
                    console.log("insert: " + docId + " : " + revId + " : " + version);

                    _self.p_db.attachment.insert(docId, version, data, contentType, { rev: revId },
                        function (err, body) {
                            if (!err) {
                                _updateRevision(body.id, body.rev);
                                if (callback) callback(err === null);
                            }
                            _logResponse(err, body);
                        });
                });
            }
        });
    };

    var _saveDocument = function (doc, callback) {
        _self.p_db.insert(doc, {}, function (err, body) {
            if (!err) {
                _updateRevision(body.id, body.rev);
                if (callback) callback(body.id);
            }
            _logResponse(err, body);
        });
    };

    var _serveAttachment = function (filename, version, req, res) {
        logger.log("_serveAttachment: " + filename, 1);
        //--how do we identify unique images (since they could have the same file name?)
        _self.p_view('byFilename', {"key": filename}, function (err, body) {
            if (!err) {
                if (body.rows && body.rows.length > 0) {
                    var docId = body.rows[0].value;
                    logger.log("Serving image: " + docId + " : " + filename + " : " + version, 1);
                    _self.p_db.attachment.get(docId, version).pipe(res);
                }
            } else {
                logger.log("Problem serving image: " + err.description);
            }
        });
        //res.writeHead(200, {'Content-Type': 'text/html','Content-Length': stat.size});
    };

    var _loadAttachment = function (filename, version, callback) {
        logger.log("_loadAttachment: " + filename, 1);
        //--how do we identify unique images (since they could have the same file name?)
        _self.p_view('byFilename', {"key": filename}, function (err, body) {
            if (err) {
                logger.log("Problem serving image: " + err.description);
                return;
            }
            if (body.rows && body.rows.length > 0) {
                var docId = body.rows[0].value;
                _self.p_db.attachment.get(docId, version, function (err, body) {
                    if (err) {
                        logger.log("Problem fetching attachment: " + err.description);
                        return;
                    }
                    callback(body);
                });
            }
        });
        //res.writeHead(200, {'Content-Type': 'text/html','Content-Length': stat.size});
    };

    var _listFiles = function (groupId, callback) {
        _self.p_view('byGroup', {"key": groupId}, function (err, body) {
            if (!err) {
                var ans = [];
                body.rows.forEach(function (row, i) {
                    var doc = row.value;
                    ans.push({filename: doc.filename});
                });
                callback(ans);
            }
        });
    };

    //region public API
    this.saveAttachment = function (docId, version, contentType, path, callback) {
        _saveAttachment(docId, version, contentType, path, callback);
    };

    this.saveDocument = function (doc, callback) {
        _saveDocument(doc, callback);
    };

    this.serveAttachment = function (filename, version, req, res) {
        _serveAttachment(filename, version, req, res);
    };

    this.loadAttachment = function (filename, version, callback) {
        _loadAttachment(filename, version, callback);
    };

    this.listFiles = function (groupId, callback) {
        _listFiles(groupId, callback);
    };

    this.deleteFile = function (groupId, name, callback) {
        _deleteFile(groupId, name, callback);
    };
    //endregion

    _init();
};

module.exports = new ImageDataHandler();