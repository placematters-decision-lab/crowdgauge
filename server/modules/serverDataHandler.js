/**
 * User: KGoulding
 * Date: 9/19/12
 * Time: 9:33 AM
 */
//region includes
var config = require("../config");

var db_name = "contribute";
var nano = require('nano')(config.couchURL);

var db = nano.db.use(db_name);
var url = require('url');

var logger = require("./logger");
var Enums = require('../../shared/classes/modules/Enums');
var Content = require('../../shared/classes/modules/Content');
//endregion

/**
 Server-side data handler - works with client-side @see SAS.DataHandler
 @class ServerDataHandler
 */
ServerDataHandler = function () {
    var _self = this;

    var _filename = "test1";
    var _socketHandler;

    //region private fields and methods
    var _init = function () {
        _createViews();
    };

    var _addOrUpdate = function (doc, docId, callback) {
        if (docId) {
            db.head(docId, function (err, _, headers) {
                if (err) {
                    //probably a 404 in which case we don't need a 'revision'
                } else {
                    doc._rev = JSON.parse(headers.etag);
                }
                db.insert(doc, docId, function (err, res) {
                    if (err) console.log("ERROR: problem adding doc: " + err.description);
                    if (callback) callback();
                });
            });
        } else {
            db.insert(doc, {}, function (err, res) {
                if (err) console.log("ERROR: problem adding doc: " + err.description);
                if (callback) callback();
            });
        }
    };

    var _createViews = function () {

        var views = {
            "views":{
                files:{
                    map:function (/**Content*/doc) {
                        if (doc.filename) emit(doc.filename, doc);
                    }
                },
                mechIds:{
                    map:function (/**Content*/doc) {
                        if (doc.contentType == "mech_def") emit(doc.filename, doc.structureId.mechanism);
                    }
                },
                priorityIds:{
                    map:function (/**Content*/doc) {
                        if (doc.contentType == "priority_def") emit(doc.filename, doc.structureId.priority);
                    }
                },
                byPriorityIds:{
                    map:function (/**Content*/doc) {
                        if (doc.structureId.priority && doc.structureId.priority !== "") emit(doc.structureId.priority, doc);
                    }
                },
                byMechanismIds:{
                    map:function (/**Content*/doc) {
                        if (doc.structureId.mechanism && doc.structureId.mechanism !== "") emit(doc.structureId.mechanism, doc);
                    }
                },
                byFullStructureId:{
                    map:function (/**Content*/doc) {
                        if (doc.structureId) emit([doc.structureId.priority, doc.structureId.mechanism], doc);
                    }
                }
            }
        };
        _addOrUpdate(views, '_design/views');
    };

    var _withViewData = function (view, fn, callback) {
        db.view('views', view, {"key":_filename}, function (err, body) {
            if (!err) {
                var ans = [];
                body.rows.forEach(function (row, i) {
                    fn(row.value);
                });
            }
            callback();
        });
    };
    var _saveContent = function (/**Content*/c, callback) {
        c.filename = _filename;
        _addOrUpdate(c, c._id, callback);
    };

    var _addPriority = function (/**SAS.PriorityDef*/p, res) {
        //--add priorityDef
        var prioId = p.uid;
        var content = new Content();
        content.structureId.priority = prioId;
        content.contentType = Enums.CTYPE_PRIORITY;
        content.data = p;
        _saveContent(content);
        //--loop through all mech def IDs and add a content cell for each
        _withViewData("mechIds", function (mId) {
            var content = new Content();
            content.structureId = {priority:prioId, mechanism:mId};
            _saveContent(content);
        }, function () {
            _returnBasicSuccess(res);
        });
    };

    var _takeLock = function (user, force, structureId, res) {
        db.view('views', 'byFullStructureId', { key:[structureId.priority, structureId.mechanism] }, function (err, body) {
            if (body && body.rows.length > 0) {
                var doc = body.rows[0].value;
                if (force || doc.lock == Enums.LOCK_NONE) {
                    doc.lock = (force) ? Enums.LOCK_NONE : user;
                    _saveContent(doc, function () {
                        _returnJsonObj(res, true);
                        _socketHandler.broadcastUpdate('lockStateChanged', {lock:doc.lock, structureId:structureId});
                    });
                } else {
                    _returnJsonObj(res, doc.lock == user);//--if the user already has this lock then return true so they can edit
                }
            } else {
                _returnJsonObj(res, false);
            }
        });
    };

    var _releaseLock = function (user, structureId, res) {
        db.view('views', 'byFullStructureId', { key:[structureId.priority, structureId.mechanism] }, function (err, body) {
            if (body && body.rows.length > 0) {
                var doc = body.rows[0].value;
                doc.lock = Enums.LOCK_NONE;
                _saveContent(doc, function () {
                    _returnBasicSuccess(res);
                    _socketHandler.broadcastUpdate('lockStateChanged', {lock:doc.lock, structureId:structureId});
                });
            } else {
                _returnBasicSuccess(res);
            }
        });
    };

    var _addMechanism = function (/**SAS.MechanismDef*/m, res) {
        //--add mechDef
        var mechId = m.uid;
        var content = new Content();
        content.structureId.mechanism = mechId;
        content.contentType = Enums.CTYPE_MECH;
        content.data = m;
        _saveContent(content);
        //--loop through all priority def IDs and add a content cell for each
        _withViewData("priorityIds", function (pId) {
            var content = new Content();
            content.structureId = {priority:pId, mechanism:mechId};
            _saveContent(content);
        }, function () {
            _returnBasicSuccess(res);
        });
    };

    var _updateContent = function (/**Content*/content, releaseLock, req, res) {
        if (releaseLock) content.lock = Enums.LOCK_NONE;
        _saveContent(content, function () {
            _returnBasicSuccess(res);
        });
    };

    var _deletePriority = function (priorityId, req, res) {
        //--remove all content types with structureId.priority == id
        db.view('views', 'byPriorityIds', { key:priorityId }, function (err, body) {
            _deleteAllResults(res, body);
        });
    };

    var _deleteMechanism = function (mechId, req, res) {
        //--remove all content types with structureId.mechanism == id
        db.view('views', 'byMechanismIds', { key:mechId }, function (err, body) {
            _deleteAllResults(res, body);
        });
    };

    var _getAllContent = function (req, res) {
        var url_parts = url.parse(req.url, true);
        var query = url_parts.query;
        db.view('views', 'files', { key:query.filename }, function (err, body) {
            _returnResults(res, body);
        });
    };

    var _deleteAllResults = function (res, body) {
        if (body) {
            body.rows.forEach(function (row, i) {
                var doc = row.value;
                db.destroy(doc._id, doc._rev, function (err, body) {
                    // Handle response
                });
            });
        }
        _returnBasicSuccess(res);
    };

    function _returnResults(res, body) {
        var ans = [];
        if (body) {
            body.rows.forEach(function (row, i) {
                ans.push(row.value);
            });
        }
        _returnJsonObj(res, ans);
    }

    var _returnJsonObj = function (res, obj) {
        res.writeHeader(200, {"Content-Type":"application/json"});
        res.write(JSON.stringify(obj));
        res.end();
    };

    var _returnBasicSuccess = function (res) {
        _returnJsonObj(res, "OK");
    };
    //endregion

    //region public API
    //--these are routed through index.js (any new methods must be specified there)
    /** @see SAS.DataHandler.takeLock */
    this.takeLock = function (req, res, postData) {
        var user = postData.user;
        var force = postData.force == "true";
        var structureId = JSON.parse(postData.structureId);
        _takeLock(user, force, structureId, res);
    };
    /** @see SAS.DataHandler.releaseLock */
    this.releaseLock = function (req, res, postData) {
        var user = postData.user;
        var structureId = JSON.parse(postData.structureId);
        _releaseLock(user, structureId, res);
    };
    /** @see SAS.DataHandler.addPriority */
    this.addPriority = function (req, res, postData) {
        var dataObj = JSON.parse(postData.data);
        _addPriority(dataObj, res);
    };
    /** @see SAS.DataHandler.addMechanism */
    this.addMechanism = function (req, res, postData) {
        var dataObj = JSON.parse(postData.data);
        _addMechanism(dataObj, res);
    };
    /** @see SAS.DataHandler.deletePriority */
    this.deletePriority = function (req, res, postData) {
        _deletePriority(postData.id, req, res);
    };
    /** @see SAS.DataHandler.deleteMechanism */
    this.deleteMechanism = function (req, res, postData) {
        _deleteMechanism(postData.id, req, res);
    };
    /** @see SAS.DataHandler.updateContent */
    this.updateContent = function (req, res, postData) {
        var dataObj = JSON.parse(postData.data);
        var releaseLock = JSON.parse(postData.releaseLock);
        _updateContent(dataObj, releaseLock, req, res);
    };
    /** @see SAS.DataHandler.getAllContent */
    this.getAllContent = function (req, res, postData) {
        _getAllContent(req, res);
    };

    this.setSocketHandler = function (socketHandler) {
        _socketHandler = socketHandler;
    };
    //endregion

    _init();
};

module.exports = new ServerDataHandler();

