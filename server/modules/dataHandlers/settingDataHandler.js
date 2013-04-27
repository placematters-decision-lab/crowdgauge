/**
 * User: ycui
 * Date: 4/25/13
 * Time: 3:52 PM
 */
//region nodejs core
var config = require('../../config');
var db_name = 'settings';
var url = require('url');
var util = require('util');
//endregion

//region dependencies
//endregion

//region modules
var logger = require("./../logger");
var aDataHandler = require('./aDataHandler');
var Response = require('../../../shared/classes/modules/Response');
var Enums = require('../../../shared/classes/modules/Enums');
//endregion

/**
 @class SettingDataHandler
 @extends ADataHandler
 */
SettingDataHandler = function () {
    var _self = this;
    aDataHandler.ADataHandler.call(this, db_name);
    var _filename = "test1";

    var _init = function () {
        _createViews();
    };

    // create views
    var _createViews = function () {
        _self.p_createViews({
            "views":{
                "byContentType": {
                    "map": function (/**Content*/doc) {
                        if (doc.contentType) emit([doc.filename, doc.contentType], doc);
                    }
                },

                "byCommunityName": {
                    "map": function (/**Content*/doc) {
                        if (doc.contentType) emit([doc.filename, doc.contentType, doc.data.name], doc);
                    }
                }
            }
        });
    }

    //region private functions
    var _getQuery = function (req) {
        var url_parts = url.parse(req.url, true);
        return url_parts.query;
    };

    var _getCommunities = function (req, res) {
        var query = _getQuery(req);
        _self.p_view('byContentType', {key: [query.filename, Enums.CTYPE_COMMUNITY] }, function (err, body) {
            if (body && body.rows) {
                var numRows = body.rows.length;
                var cObjs = [];
                body.rows.forEach(function (row, i) {
                    var doc = row.value;
                    var cDef = doc.data;
                    var cObj = {data: cDef};
                    cObjs.push(cObj);
                });
                _self.p_returnJsonObj(res, cObjs);
            }
        });
    }

    var _getCommunity = function (communityName, req, res) {
        var query = _getQuery(req);
        _self.p_view('byCommunityName', {key: [query.filename, Enums.CTYPE_COMMUNITY, communityName] }, function (err, body) {
            if (body) {
                var cObjs = [];
                body.rows.forEach(function (row, i) {
                    var doc = row.value;
                    var cDef = doc.data;
                    var cObj = {data: cDef};
                    cObjs.push(cObj);
                });
                _self.p_returnJsonObj(res, cObjs);
            }
        });
    }
    //endregion

    //region public API
    this.getCommunities = function (req, res, postData) { // used by responseDataHandler.getTopMechByCommunity
        _getCommunities(req, res);
    }

    this.getCommunity = function (req, res, postData) { // used by responseDataHandler.getTopMechByCommunity
        var dataObj = JSON.parse(postData.data);
        _getCommunities(dataObj, req, res);
    }
    //endregion

    _init();
};

module.exports = new SettingDataHandler();