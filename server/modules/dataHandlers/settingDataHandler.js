/**
 * User: ycui
 * Date: 4/25/13
 * Time: 3:52 PM
 */
//region nodejs core
if(process.env.NODE_ENV == 'production') {
    var config = require("../../config");
} else {
    var config = require("../../config.development");
}
var db_name = 'settings_okc';
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
    var _filename = "OKC"; // TODO: filename

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
                }
            }
        });
    }

    //region private functions
    var _getQuery = function (req) {
        var url_parts = url.parse(req.url, true);
        return url_parts.query;
    };

    var _getLocations = function (req, res) { // for client-side call
        var query = _getQuery(req);
        _self.p_view('byContentType', {key: [query.filename, Enums.CTYPE_LOCATION] }, function (err, body) { // TODO: filename
            if (err) {
                console.log('Error in byContentType: '+err);
                _self.p_returnBasicFailure(res, err);
                return;
            }
            if (body && body.rows && !err) {
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
    //endregion

    //region public API
    this.getLocations = function (req, res, postData) { // for client-side
        _getLocations(req, res);
    }
    //endregion

    _init();
};

module.exports = new SettingDataHandler();