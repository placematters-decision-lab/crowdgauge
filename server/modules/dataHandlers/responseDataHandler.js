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

    aDataHandler.ADataHandler.call(this, 'responses_nrv');

    var _init = function () {
        _createViews();
    };

    var _createViews = function () {
        _self.p_createViews({
            "views":{
                "all":{
                    "map":function (doc) {
                        emit(doc._id, doc);
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

    var _saveResponse = function (/**Object*/p, req, res) {
        var response = new Response();
        response.ipAddress = _getIpAddress(req);
        response.dateCreated = new Date();
        response.data = p;
        _updateResponse(response, function () {
            _self.p_returnBasicSuccess(res);
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
    //endregion

};

util.inherits(ResponseDataHandler, aDataHandler.ADataHandler);

var exportObj = new ResponseDataHandler();
exportObj.init();
module.exports = exportObj;
