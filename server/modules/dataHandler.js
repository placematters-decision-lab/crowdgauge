/**
 * User: KGoulding
 * Date: 9/19/12
 * Time: 9:33 AM
 */
//region includes
var config = require("../../config");

var db_name = "contribute";
var nano = require('nano')(config.couchURL);

var db = nano.db.use(db_name);
var url = require('url');

var Enums = require('../../shared/classes/modules/Enums');
var Content = require('../../shared/classes/modules/Content');
//endregion

/**
 Server-side data handler - works with client-side @see SAS.DataHandler
 @module dataHandler
 @class ServerDataHandler
 */
ServerDataHandler = function () {
    var _self = this;

    var _filename = "test1";

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

    //region private fields and methods
    //todo search for db and replace all w/ nano equiv below this line...

    var _saveContent = function (/**Content*/c, callback) {
        c.filename = _filename;
        _addOrUpdate(c, c._id, callback);
    };

    var _addPriority = function (/**SAS.PriorityDef*/p, response) {
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
            _returnBasicSuccess(response);
        });
    };

    var _addMechanism = function (/**SAS.MechanismDef*/m, response) {
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
            _returnBasicSuccess(response);
        });
    };

    var _updateContent = function (/**Content*/content, request, response) {
        _saveContent(content, function () {
            _returnBasicSuccess(response);
        });
    };

    var _deletePriority = function (priorityId, request, response) {
        //--remove all content types with structureId.priority == id
        db.view('views', 'byPriorityIds', { key:priorityId }, function (err, body) {
            _deleteAllResults(response, body);
        });
    };

    var _deleteMechanism = function (mechId, request, response) {
        //--remove all content types with structureId.mechanism == id
        db.view('views', 'byMechanismIds', { key:mechId }, function (err, body) {
            _deleteAllResults(response, body);
        });
    };

    var _getAllContent = function (request, response) {
        var url_parts = url.parse(request.url, true);
        var query = url_parts.query;
        db.view('views', 'files', { key:query.filename }, function (err, body) {
            _returnResults(response, body);
        });
    };

    var _deleteAllResults = function (response, body) {
        if (body) {
            body.rows.forEach(function (row, i) {
                var doc = row.value;
                db.destroy(doc._id, doc._rev, function (err, body) {
                    // Handle response
                });
            });
        }
        _returnBasicSuccess(response);
    };

    function _returnResults(response, body) {
        var ans = [];
        if (body) {
            body.rows.forEach(function (row, i) {
                ans.push(row.value);
            });
        }
        _returnJsonObj(response, ans);
    }

    var _returnJsonObj = function (response, obj) {
        response.writeHeader(200, {"Content-Type":"application/json"});
        response.write(JSON.stringify(obj));
        response.end();
    };

    var _returnBasicSuccess = function (response) {
        _returnJsonObj(response, "OK");
    };
    //endregion

    //region public API
    /** @see SAS.DataHandler.addPriority */
    this.addPriority = function (request, response, postData) {
        var dataObj = JSON.parse(postData.data);
        _addPriority(dataObj, response);
    };
    /** @see SAS.DataHandler.addMechanism */
    this.addMechanism = function (request, response, postData) {
        var dataObj = JSON.parse(postData.data);
        _addMechanism(dataObj, response);
    };
    /** @see SAS.DataHandler.deletePriority */
    this.deletePriority = function (request, response, postData) {
        _deletePriority(postData.id, request, response);
    };
    /** @see SAS.DataHandler.deleteMechanism */
    this.deleteMechanism = function (request, response, postData) {
        _deleteMechanism(postData.id, request, response);
    };
    /** @see SAS.DataHandler.updateContent */
    this.updateContent = function (request, response, postData) {
        var dataObj = JSON.parse(postData.data);
        _updateContent(dataObj, request, response);
    };
    /** @see SAS.DataHandler.getAllContent */
    this.getAllContent = function (request, response, postData) {
        _getAllContent(request, response);
    };
    //endregion

    _init();
};

module.exports = new ServerDataHandler();

