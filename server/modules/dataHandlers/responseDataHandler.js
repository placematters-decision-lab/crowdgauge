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

//endregion

var events = require("events");

/**
 @class ResponseDataHandler
 @extends ADataHandler
 */
var ResponseDataHandler = function () {
    var _self = this;
    var _filename = "test1"; // TODO

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
            "views":{
                "all":{
                    "map":function (doc) {
                        emit(doc._id, doc);
                    }
				},

                getPriCountForZip: {
                    map: function (/**Content*/doc) {
                        if (doc.data && doc.data.demographics && doc.data.demographics.zip && doc.data.priorities) {
                            Object.keys(doc.data.priorities).forEach(function(k) {
                                emit([doc.data.demographics.zip, k], doc.data.priorities[k]);
                            });
                        }
                    },
                    reduce: '_sum'

                },

                getMechCountForZip: {
                    map: function (/**Content*/doc) {
                        if (doc.data && doc.data.demographics && doc.data.demographics.zip && doc.data.mechanisms) {
                            Object.keys(doc.data.mechanisms).forEach(function(k) {
                                emit([doc.data.demographics.zip, k], 1);   // doc.data.mechanisms[k], count for mount, not for coins
                            });
                        }
                    },
                    reduce: '_sum'
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

    var _saveResponse = function (/**Object*/p, req, res) {
        var response = new Response();
        response.ipAddress = _getIpAddress(req);
        response.dateCreated = new Date();
        response.data = p;
        _updateResponse(response, function () {
            _self.p_returnBasicSuccess(res);
        });
    };


    // priorities
    var _getPriCountForZip = function (req, res) {   // TODO HERE!!!!!!
        _self.p_view('getPriCountForZip', {group:true}, function (err, body) {
            if (err) {
                console.log('Error in getPriCountForZip: '+err);
                _self.p_returnBasicFailure(res, err);
                return;
            }
            if (body && body.rows) {
                var mObjs = []; // return: array contains objects
                body.rows.forEach (function (row, i) {
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
        _self.p_view('getMechCountForZip', {group:true}, function (err, body) {
            if (err) {
                console.log('Error in getMechCountForZip: '+err);
                _self.p_returnBasicFailure(res, err);
                return;
            }
            if (body && body.rows) {
                var mObjs = []; // return: array contains objects
                body.rows.forEach (function (row, i) {
                    var mechId = row.key[1].split("_")[0];
                    mObj = {zip: row.key[0], itemId: mechId, count: row.value};
//                    mObj = {zip: row.key[0],mechId: row.key[1], count: row.value};
                    mObjs.push(mObj);
                });
                _self.p_returnJsonObj(res, mObjs);
            }
        });
    };
    //region public API
    this.saveResponse = function (req, res, postData) {
        var dataObj = JSON.parse(postData.data);
        _saveResponse(dataObj, req, res);
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
