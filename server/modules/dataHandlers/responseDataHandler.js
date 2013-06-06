//region nodejs core
var fs = require("fs");
var url = require('url');
var util = require('util');
//endregion
//region dependencies

//endregion
//region modules

var logger = require("./../logger");
var aDataHandler = require('./aDataHandler');
var Response = require('../../../shared/classes/modules/Response');

/** @type PhantomProxy */
var phantomProxy = require("../phantomProxy");

//endregion

var events = require("events");

/**
 @class ResponseDataHandler
 @extends ADataHandler
 */
var ResponseDataHandler = function () {
    var _self = this;
    var _filename = 'test1'; // TODO
    var _responseIdPassword = '5EVu8EkA';

    aDataHandler.ADataHandler.call(this, 'responses');
    /** @type SettingDataHandler */
    var _settingDataHandler;

    var _init = function () {
        _createViews();
    };

    var _getQuery = function (req) {
        var url_parts = url.parse(req.url, true);
        return url_parts.query;
    };
    var _createViews = function () {
        _self.p_createViews({
            "views": {
                "all": {
                    map: function (doc) {
                        emit(doc._id, doc);
                    }
                },
                "byResponseId": {
                    map: function (doc) {
                        if (doc.responseId) emit(doc.responseId, doc);
                    }
                },
                "getPriCountForZip": {
                    map: function (/**Content*/doc) {
                        if (doc.data && doc.data.demographics && doc.data.demographics.zip && doc.data.priorities) {
                            Object.keys(doc.data.priorities).forEach(function (k) {
                                emit([doc.data.demographics.zip, k], doc.data.priorities[k]);
                            });
                        }
                    },
                    reduce: '_sum'
                },
                "getMechCountForZip": {
                    map: function (/**Content*/doc) {
                        if (doc.data && doc.data.demographics && doc.data.demographics.zip && doc.data.mechanisms) {
                            Object.keys(doc.data.mechanisms).forEach(function (k) {
                                emit([doc.data.demographics.zip, k], 1);   // doc.data.mechanisms[k], count for mount, not for coins
                            });
                        }
                    },
                    reduce: '_sum'
                },
                "leaderNameExists": {
                    map: function (/**Content*/doc) {
                        if (doc.data && doc.data.leadername) {
                            emit(doc.data.leadername, true);
                        }
                    }
                },
                "getLeaderName": {
                    map: function (/**Content*/doc) {
                        if (doc.data && doc.responseId && doc.data.leadername) {
                            emit(doc.responseId, doc.data.leadername);
                        }
                    }
                }
            }
        });
    };

    var _updateResponse = function (/**Response*/c, callback) {
        _self.p_addOrUpdate(c, c._id, callback);
    };

    var _getIpAddress = function (req) {
        var ip_address = "unknown";
        try {
            ip_address = req.headers['x-forwarded-for'];
        }
        catch (error) {
            ip_address = req.connection.remoteAddress;
        }
        return ip_address;
    };

    var _getReponseAuth = function (responseId) {
        return  _self.p_getHash(responseId + '_' + _responseIdPassword).substr(0, 12);//just return a shorter 12 char password
    };

    var _saveResponse = function (/**Object*/p, req, res) {
        var response = new Response();
        response.ipAddress = _getIpAddress(req);
        response.dateCreated = new Date();
        var responseId = _self.p_getUID();
        response.responseId = responseId;
        response.data = p;
        response.filename = _filename;
        _updateResponse(response, function () {
            _self.p_returnJsonObj(res, {responseId: responseId, responseAuth: _getReponseAuth(responseId)});
        });
    };

    var _getResponse = function (responseId, callback, errback) {
        _self.p_view('byResponseId', {"key": responseId}, function (err, body) {
            if (err) {
                console.log('Error in byResponseId: ' + err);
                if (errback) errback(err);
            } else {
                var ans = null;
                body.rows.forEach(function (row, i) {
                    ans = row.value;//should only be 1!
                });
                if (callback) callback(ans);
            }
        });
    };


    // priorities
    var _getPriCountForZip = function (req, res) {   // TODO HERE!!!!!!
        _self.p_view('getPriCountForZip', {group: true}, function (err, body) {
            if (err) {
                console.log('Error in getPriCountForZip: ' + err);
                _self.p_returnBasicFailure(res, err);
                return;
            }
            if (body && body.rows) {
                var mObjs = []; // return: array contains objects
                body.rows.forEach(function (row, i) {
                    mObj = {zip: row.key[0], itemId: row.key[1], count: row.value};
//                    mObj = {zip: row.key[0],mechId: row.key[1], count: row.value};
                    mObjs.push(mObj);
                });
                _self.p_returnJsonObj(res, mObjs);
            }
        });
    };

    // mechanisms
    var _getMechCountForZip = function (req, res) {
        _self.p_view('getMechCountForZip', {group: true}, function (err, body) {
            if (err) {
                console.log('Error in getMechCountForZip: ' + err);
                _self.p_returnBasicFailure(res, err);
                return;
            }
            if (body && body.rows) {
                var mObjs = []; // return: array contains objects
                body.rows.forEach(function (row, i) {
                    var mechId = row.key[1].split("_")[0];
                    mObj = {zip: row.key[0], itemId: mechId, count: row.value};
//                    mObj = {zip: row.key[0],mechId: row.key[1], count: row.value};
                    mObjs.push(mObj);
                });
                _self.p_returnJsonObj(res, mObjs);
            }
        });
    };
    var _validateLeadername = function (req, res) {
        var q = _self.p_getQuery(req);
        _self.p_view('leaderNameExists', {key: q.leadername}, function (err, body) {
            if (err) {
                console.log('Error in validateLeadername: ' + err);
                _self.p_returnBasicFailure(res, err);
                return;
            }
            var exists = (body && body.rows && body.rows.length > 0);
            _self.p_returnJsonObj(res, {unique: !exists});
        });
    };
    var _getLeadername = function (req, res) {
        var q = _self.p_getQuery(req);
        if (!q.responseId) {
            _self.p_returnBasicFailure(res, 'responseId not specified');
            return;
        }
        _self.p_view('getLeaderName', {key: q.responseId}, function (err, body) {
            if (err) {
                console.log('Error in getLeadername: ' + err);
                _self.p_returnBasicFailure(res, err);
                return;
            }
            var leadername = '';
            if (body && body.rows && body.rows.length > 0) {
                leadername = body.rows[0].value;
            }
            _self.p_returnJsonObj(res, {leadername: leadername});
        });
    };
    var _saveLeadername = function (req, res) {
        var q = _self.p_getQuery(req);
        if (!q.responseId) {
            _self.p_returnBasicFailure(res, 'responseId not specified');
            return;
        }
        if (!q.leadername) {
            _self.p_returnBasicFailure(res, 'leadername not specified');
            return;
        }
        _getResponse(q.responseId, function (ans) {
            if (ans) {
                ans.data.leadername = q.leadername;
                _self.p_addOrUpdate(ans, ans._id, function () {
                    _self.p_returnBasicSuccess(res);
                });
            } else {
                _self.p_returnBasicFailure(res, 'response empty: ' + q.responseId);
            }
        }, function (err) {
            _self.p_returnBasicFailure(res, err);
        });
    };
    //region public API
    this.saveResponse = function (req, res, postData) {
        var dataObj = JSON.parse(postData.data);
        _saveResponse(dataObj, req, res);
    };

    this.getResponse = function (req, res, postData) {
        var responseId = _getQuery(req).responseId;
        if (!responseId) {
            _self.p_returnBasicFailure(res, 'No responseId');
            return;
        }
        _getResponse(responseId, function (ans) {
            _self.p_returnJsonObj(res, ans);
        }, function (err) {
            _self.p_returnBasicFailure(res, err);
        });
    };

    this.init = function () {
        _init();
    };


    this.getPriCountForZip = function (req, res, postData) {
        _getPriCountForZip(req, res);
    };

    this.getMechCountForZip = function (req, res, postData) {
        _getMechCountForZip(req, res);
    };

    this.saveLeadername = function (req, res, postData) {
        _saveLeadername(req, res);
    };

    this.validateLeadername = function (req, res, postData) {
        _validateLeadername(req, res);
    };
    this.getLeadername = function (req, res, postData) {
        _getLeadername(req, res);
    };

    this.png = function (req, res, postData) {
        var q = _self.p_getQuery(req);
        _getResponse(q.responseId, function (ans) {
            if (ans) {
                phantomProxy.png(res, ans);
            } else {
                _self.p_returnBasicFailure(res, 'response empty: ' + q.responseId);
            }
        }, function (err) {
            _self.p_returnBasicFailure(res, err);
        });

    };

    //====================================
    this.setHandlers = function (settingDataHandler) {
        _settingDataHandler = settingDataHandler;
    };
    //endregion

};

util.inherits(ResponseDataHandler, aDataHandler.ADataHandler);

var exportObj = new ResponseDataHandler();
exportObj.init();
module.exports = exportObj;
