/**
 * User: KGoulding
 * Date: 9/19/12
 * Time: 9:33 AM
 */
//region includes
var db_name = "contribute";
var cradle = require('cradle');//TODO move from cradle to nano - http://sasakistrategies.myjetbrains.com/youtrack/issue/BB-23

var url = require('url');
var db = new (cradle.Connection)().database(db_name);

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

    db.save('_design/views', {
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
    });

    var _withViewData = function (view, fn, callback) {
        db.view('views/'+view, { key:_filename }, function (err, res) {
            if (res) {
                res.forEach(function (row) {
                    fn(row);
                });
            }
            callback();
        });
    };

    //region private fields and methods
    var _getUID = function () {
        var msSince2012 = new Date().getTime()-1325376000000;
        return msSince2012 + "-" + Math.floor(Math.random()*10000);
    };

    var _saveContent = function (/**Content*/c, callback) {
        c.filename = _filename;
        if (c._id) {//_id will be defined if this content object originally came from couch. This is treated as an update case
            db.save(c._id, null, c, function (err, res) {
                // Handle response
                if (callback) callback();
            });
        } else {
            db.save(c, function (err, res) {
                // Handle response
                if (callback) callback();
            });
        }
    };

    var _addPriority = function (/**SAS.PriorityDef*/p, response) {
        //--add priorityDef
        var prioId = "p"+_getUID();
        var content = new Content();
        content.structureId.priority = prioId;
        content.contentType = Enums.CTYPE_PRIORITY;
        content.data = p;
        _saveContent(content);
        //--loop through all mech def IDs and add a content cell for each
        _withViewData("mechIds", function(mId) {
            var content = new Content();
            content.structureId = {priority:prioId, mechanism:mId};
            _saveContent(content);
        }, function() {
            _returnBasicSuccess(response);
        });
    };

    var _addMechanism = function (/**SAS.MechanismDef*/m, response) {
        //--add mechDef
        var mechId = "m"+_getUID();
        var content = new Content();
        content.structureId.mechanism = mechId;
        content.contentType = Enums.CTYPE_MECH;
        content.data = m;
        _saveContent(content);
        //--loop through all priority def IDs and add a content cell for each
        _withViewData("priorityIds", function(pId) {
            var content = new Content();
            content.structureId = {priority:pId, mechanism:mechId};
            _saveContent(content);
        }, function() {
            _returnBasicSuccess(response);
        });
    };

    var _updateContent = function (/**Content*/content, request, response) {
        _saveContent(content, function() {
            _returnBasicSuccess(response);
        });
    };

    var _deletePriority = function (priorityId, request, response) {
        //--remove all content types with structureId.priority == id
        db.view('views/byPriorityIds', { key:priorityId }, function (err, res) {
            _deleteAllResults(response, res);
        });
    };

    var _deleteMechanism = function (mechId, request, response) {
        //--remove all content types with structureId.mechanism == id
        db.view('views/byMechanismIds', { key:mechId }, function (err, res) {
            _deleteAllResults(response, res);
        });
    };

    var _getAllContent = function (request, response) {
        var url_parts = url.parse(request.url, true);
        var query = url_parts.query;
        db.view('views/files', { key:query.filename }, function (err, res) {
            _returnResults(response, res);
        });
    };

    var _deleteAllResults = function (response, res) {
        if (res) {
            res.forEach(function (row) {
                db.remove(row._id, row._rev, function (err, res) {
                    // Handle response
                });
            });
        }
        _returnBasicSuccess(response);
    };

    function _returnResults(response, res) {
        var ans = [];
        if (res) {
            res.forEach(function (row) {
                ans.push(row);
            });
        }
        _returnJsonObj(response, ans);
    }

    var _returnJsonObj = function(response, obj) {
        response.writeHeader(200, {"Content-Type":"application/json"});
        response.write(JSON.stringify(obj));
        response.end();
    };

    var _returnBasicSuccess = function(response) {
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
};

module.exports = new ServerDataHandler();

