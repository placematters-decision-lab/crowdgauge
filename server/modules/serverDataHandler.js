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

//region includes
var NA = "na";
//constants
/**
 Server-side data handler - works with client-side @see SAS.DataHandler
 @class ServerDataHandler
 */
ServerDataHandler = function () {
    var _self = this;

    var _filename = "test1";
    var _socketHandler;

    /** @type ImageDataHandler */
    var _imageDataHandler;

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
                byContentType: {
                    map:function (/**Content*/doc) {
                        if (doc.contentType) emit([doc.filename, doc.contentType], doc);
                    }
                },
                cellsByMechanismId:{
                    map:function (/**Content*/doc) {
                        if (doc.contentType === 'cell' && doc.structureId.mechanism && doc.structureId.mechanism !== "") emit(doc.structureId.mechanism, doc);
                    }
                },
                mechIds:{
                    map:function (/**Content*/doc) {
                        if (doc.contentType === 'mech_def') emit(doc.filename, doc.structureId.mechanism);
                    }
                },
                priorityIds:{
                    map:function (/**Content*/doc) {
                        if (doc.contentType === 'priority_def') emit(doc.filename, doc.structureId.priority);
                    }
                },
                actionIds:{
                    map:function (/**Content*/doc) {
                        if (doc.contentType === 'action_def') emit(doc.filename, doc.structureId.action);
                    }
                },
                byPriorityIds:{
                    map:function (/**Content*/doc) {
                        if (doc.structureId.priority && doc.structureId.priority !== '') emit(doc.structureId.priority, doc);
                    }
                },
                byActionIds:{
                    map:function (/**Content*/doc) {
                        if (doc.structureId.action && doc.structureId.action !== '') emit(doc.structureId.action, doc);
                    }
                },
                byMechanismIds:{
                    map:function (/**Content*/doc) {
                        if (doc.structureId.mechanism && doc.structureId.mechanism !== '') emit(doc.structureId.mechanism, doc);
                    }
                },
                byTypeAndStructureId:{
                    map:function (/**Content*/doc) {
                        if (doc.structureId) {
                            var secondKey = doc.structureId.priority ? doc.structureId.priority : doc.structureId.action;
                            var cellType = doc.structureId.priority ? 'priority' : 'action';
                            emit([doc.contentType, cellType, doc.structureId.mechanism, secondKey], doc);
                        }
                    }
                },
                byTypeAndMechId:{
                    map:function (/**Content*/doc) {
                        if (doc.structureId) {
                            var cellType = doc.structureId.priority ? 'priority' : 'action';
                            emit([doc.contentType, cellType, doc.structureId.mechanism], doc);
                        }
                    }
                },
                byFullStructureId:{
                    map:function (/**Content*/doc) {
                        if (doc.structureId) {
                            var secondKey = doc.structureId.priority ? doc.structureId.priority : doc.structureId.action;
                            emit([doc.structureId.mechanism, secondKey], doc);
                        }
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

    var _addAction = function (/**SAS.ActionDef*/a, res) {
        //--add ActionDef
        var actionId = a.uid;
        var content = new Content();
        content.structureId.action = actionId;
        content.contentType = Enums.CTYPE_ACTION;
        content.data = a;
        _saveContent(content);
        //--loop through all mech def IDs and add a content cell for each
        _withViewData("mechIds", function (mId) {
            var content = new Content();
            content.structureId = {action:actionId, mechanism:mId};
            _saveContent(content);
        }, function () {
            _returnBasicSuccess(res);
        });
    };

    var _takeLock = function (user, force, structureId, res) {
        var secondKey = structureId.priority ? structureId.priority : structureId.action;
        db.view('views', 'byFullStructureId', { key:[structureId.mechanism, secondKey] }, function (err, body) {
            if (body && body.rows.length > 0) {
                var doc = body.rows[0].value;
                if (force || doc.lock === Enums.LOCK_NONE) {
                    doc.lock = (force) ? Enums.LOCK_NONE : user;
                    _saveContent(doc, function () {
                        _returnJsonObj(res, true);
                        _socketHandler.broadcastUpdate('lockStateChanged', {lock:doc.lock, structureId:structureId});
                    });
                } else {
                    _returnJsonObj(res, doc.lock === user);//--if the user already has this lock then return true so they can edit
                }
            } else {
                _returnJsonObj(res, false);
            }
        });
    };

    var _releaseLock = function (user, structureId, res) {
        var secondKey = structureId.priority ? structureId.priority : structureId.action;
        db.view('views', 'byFullStructureId', { key:[structureId.mechanism, secondKey] }, function (err, body) {
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
            //--loop through all action def IDs and add a content cell for each
            _withViewData("actionIds", function (aId) {
                var content = new Content();
                content.structureId = {action:aId, mechanism:mechId};
                _saveContent(content);
            }, function () {
                _returnBasicSuccess(res);
            });
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

    var _deleteAction = function (actionId, req, res) {
        //--remove all content types (cells and definitions) with structureId.priority == id
        db.view('views', 'byActionIds', { key:actionId }, function (err, body) {
            _deleteAllResults(res, body);
        });
    };

    var _deleteMechanism = function (mechId, req, res) {
        //--remove all content types with structureId.mechanism == id
        db.view('views', 'byMechanismIds', { key:mechId }, function (err, body) {
            _deleteAllResults(res, body);
        });
    };

    var _returnFilenameViewResults = function (req, res, view) {
        var url_parts = url.parse(req.url, true);
        var query = url_parts.query;
        db.view('views', view, { key:query.filename }, function (err, body) {
            _returnResults(res, body);
        });
    };

    var _getAllContent = function (req, res) {
        _returnFilenameViewResults(req, res, 'files');
    };

    var _getPriorities = function (req, res) {
        var url_parts = url.parse(req.url, true);
        var query = url_parts.query;
        db.view('views', 'byContentType', { key:[query.filename, Enums.CTYPE_PRIORITY] }, function (err, body) {
            if (body) {
                var pObjs = [];
                var ans = [];
                body.rows.forEach(function (row, i) {
                    var doc = row.value;
                    var pDef = doc.data;
                    var pObj = {data:pDef};
                    pObjs.push(pObj);
                });
                //--find the associated SVG for each priority (this could alternatively be done earlier - when the image is assigned)
                pObjs.forEach(function (pObj, i) {
                    _imageDataHandler.listFiles(pObj.data.uid, function (files) {
                        if (files && files.length > 0) {
                            pObj.data.svgPath = files[0].filename;
                        } else {
                            pObj.data.svgPath = "";
                        }
                        ans.push(pObj);
                        if (ans.length === pObjs.length) {//since file lists are returned async, this is how we tell that we're finished
                            _returnJsonObj(res, ans);
                        }
                    });
                });
            }
        });
    };

    var _getActions = function (req, res) {
        var query = _getQuery(req);
        var mObj = {};
        var mechId = query.mechId;

        //if priorityId is not specified, we need to get ALL priorities, so we can just use 'null'
        db.view('views', 'byTypeAndMechId', { key:['cell', 'action', mechId] }, function (err, body) {
            if (!(body && body.rows && body.rows.length > 0)) {
                mObj.actions = [];
            } else {
                mObj.actions = body.rows.map(function (row) {
                    return {aId:row.value.structureId.action, data:row.value.data};
                });
            }
            _returnJsonObj(res, mObj);
        });
    };

    var _getActionsDefs = function (req, res) {
        var query = _getQuery(req);
        db.view('views', 'byContentType', { key:[query.filename, Enums.CTYPE_ACTION] }, function (err, body) {
            if (body && body.rows) {
                var aObjs = [];
                body.rows.forEach(function (row, i) {
                    /** @type Content */
                    var doc = row.value;
                    aObjs.push(doc.data);
                });
                _returnJsonObj(res, aObjs);
            }
        });
    };

    /**
     * provide a way to convert the scores that are inserted on the user end (e.g. +1, +2 etc into more CSS friendly strings)
     * @param score
     * @return {*}
     * @private
     */
    var _cleanUpScore = function (score) {
        //TODO replace this code with a settings file that defines localizable score options and maps options to css class suffixes.
        if (typeof score !== 'string' || score === Enums.NA) return NA;
        if (score.indexOf('+') === 0) score = score.substr(1);//strip of the '+' character at the front since its not CSS-friendly
        return score;
    };

    var _getMechValues = function (body) {
        var vals = {};
        if (!body || !body.rows) return vals;
        body.rows.forEach(function (row, i) {
            /** @type Content */
            var doc = row.value;
            vals[doc.structureId.priority] = NA;
            if (doc.data && doc.data.score) {
                vals[doc.structureId.priority] = _cleanUpScore(doc.data.score);
            }
        });
        return vals;
    };

    var _getQuery = function (req) {
        var url_parts = url.parse(req.url, true);
        return url_parts.query;
    };

    var _getMechanismInfo = function (req, res) {
        var query = _getQuery(req);
        var mObj = {};
        var mechId = query.mechId;
        var priorityId = query.priorityId;

        var view = 'byTypeAndMechId';
        var keys =['cell', 'priority', mechId];
        if (priorityId) {
            view = 'byTypeAndStructureId';
            keys.push(priorityId);//pass priorityId if specified, otherwise get ALL priorities.
        }

        db.view('views', view, { key:keys }, function (err, body) {
            if (!(body && body.rows)) {
                mObj.priorities = [];
            } else {
                mObj.priorities = body.rows.map(function (row) {
                    if (row.value.data && row.value.data.score) row.value.data.score = _cleanUpScore(row.value.data.score);
                    if (row.value.structureId.priority) {
                        return {pId:row.value.structureId.priority, data:row.value.data};
                    }
                });
            }
            if (mObj.pictures && mObj.priorities) {//ensure both async operations have completed
                _returnJsonObj(res, mObj);
            }
        });
        _imageDataHandler.listFiles(mechId, function (files) {
            mObj.pictures = files;
            if (mObj.pictures && mObj.priorities) {//ensure both async operations have completed
                _returnJsonObj(res, mObj);
            }
        });
    };

    var _getMechanisms = function (req, res) {
        //TODO return error code if query.filename is null or no results found
        var query = _getQuery(req);
        db.view('views', 'byContentType', { key:[query.filename, Enums.CTYPE_MECH] }, function (err, body) {
            if (body && body.rows) {
                var numRows = body.rows.length;
                var mObjs = [];
                body.rows.forEach(function (row, i) {
                    /** @type Content */
                    var doc = row.value;
                    var mDef = doc.data;
                    var mObj = {data:mDef};
                    db.view('views', 'cellsByMechanismId', { key:doc.structureId.mechanism }, function (err, cellBody) {
                        mObj.values = _getMechValues(cellBody);
                        mObjs.push(mObj);
                        if (mObjs.length == numRows) {//we have all results and can return
                            _returnJsonObj(res, mObjs);
                        }
                    });
                });
            }
        });
    };

    var _deleteAllResults = function (res, body) {
        if (body && body.rows) {
            body.rows.forEach(function (row, i) {
                var doc = row.value;
                db.destroy(doc._id, doc._rev, function (err, body) {
                    // Handle response
                });
            });
        }
        _returnBasicSuccess(res);
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

    var _returnJsonObj = function (res, obj) {
        res.writeHeader(200, {"Content-Type":"application/json"});
        res.write(JSON.stringify(obj));
        res.end();
    };

    var _returnBasicSuccess = function (res) {
        _returnJsonObj(res, "OK");
    };

    var _TEMP_fixLang = function (obj, props, lang) {
        if (obj == null) return;
        props.forEach(function (prop) {
            var val = obj[prop];
            if (typeof val === 'string') {
                delete obj[prop];
                obj[prop] = {};
                obj[prop][lang] = val;
            }
        });
    };

    var _TEMP_fixLangs = function () {
        var filename = 'test1';
        db.view('views', 'files', { key:filename }, function (err, body) {
            body.rows.forEach(function (row, i) {
                /** @type Content */
                var doc = row.value;
                if (doc.contentType == Enums.CTYPE_CELL) {
                    _TEMP_fixLang(doc.data, ['description'], 'en');
                    _saveContent(doc);
                }
                if (doc.contentType == Enums.CTYPE_MECH) {
                    _TEMP_fixLang(doc.data, ['title', 'description', 'nickname', 'progressive'], 'en');
                    _saveContent(doc);
                }
                if (doc.contentType == Enums.CTYPE_PRIORITY) {
                    _TEMP_fixLang(doc.data, ['title', 'description', 'nickname'], 'en');
                    _saveContent(doc);
                }
            });
        });
    };
//endregion

//region public API
//--these are routed through index.js (any new methods must be specified there)
//=========== CONTRIBUTE ==================
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
    /** @see SAS.DataHandler.addAction */
    this.addAction = function (req, res, postData) {
        var dataObj = JSON.parse(postData.data);
        _addAction(dataObj, res);
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
    /** @see SAS.DataHandler.deleteAction */
    this.deleteAction = function (req, res, postData) {
        _deleteAction(postData.id, req, res);
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

//=========== PLAY ==================
    this.getPriorities = function (req, res, postData) {
        _getPriorities(req, res);
    };

    this.getActions = function (req, res, postData) {
        _getActions(req, res);
    };

    this.getActionDefs = function (req, res, postData) {
        _getActionsDefs(req, res);
    };

    this.getMechanisms = function (req, res, postData) {
        _getMechanisms(req, res);
    };

    this.getMechanismInfo = function (req, res, postData) {
        _getMechanismInfo(req, res);
    };
//====================================
    this.TEMP_fixLangs = function () {
        _TEMP_fixLangs();
    };

    this.setHandlers = function (socketHandler, imageDataHandler) {
        _socketHandler = socketHandler;
        _imageDataHandler = imageDataHandler;
    };
//endregion

    _init();
}
;

module.exports = new ServerDataHandler();

