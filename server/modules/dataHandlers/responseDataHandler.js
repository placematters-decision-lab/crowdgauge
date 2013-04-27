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
    var _filename = "test1";

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

                // for client/play/classes/framework/mapping/MapMain.js, ycui 04242013
                "getTotalMechCountForZip":{
                    "map": function (/**Content*/doc) {
                        if (doc.data && doc.data.demographics && doc.data.demographics.zip && doc.data.mechanisms) {
//                          var sum = 0; // count for mechanisms * points
//                          for (var i = 0; i < doc.data.mechanisms.length; i++) {
//                              sum += doc.data.mechanisms[i].value;
//                          }
//                          emit(doc.data.demographics.zip, sum);
                            emit(doc.data.demographics.zip, doc.data.mechanisms.lentgh); // count for mechanisms
                        }
                    },
                    "reduce": "_sum"
                },

                "getMechCountForZip": {
                    "map": function (/**Content*/doc) {
                        if (doc.data && doc.data.demographics && doc.data.demographics.zip && doc.data.mechanisms) {
                          for (var i = 0; i < doc.data.mechanisms.length; i++) {
//                              emit(doc.data.mechanisms[i].key, doc.data.mechanisms[i].value);  // count for mechanisms * points
                              emit(doc.data.demographics.zip, doc.data.mechanisms[i].key); // count for mechanisms
                          }
                        }
                    }
                },

                "getMechCountForZipMech": {
                    "map": function (/**Content*/doc) {
                        if (doc.data && doc.data.demographics && doc.data.demographics.zip && doc.data.mechanisms) {
                            for (var i = 0; i < doc.data.mechanisms.length; i++) {
//                              emit([doc.data.demographics.zip, doc.data.mechanisms[i].key], doc.data.mechanisms[i].value);  // count for mechanisms * points
                                emit([doc.data.demographics.zip, doc.data.mechanisms[i].key], 1); // count for mechanisms
                            }
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

    var _saveResponse = function (/**Object*/p, req, res) {
        var response = new Response();
        response.ipAddress = _getIpAddress(req);
        response.dateCreated = new Date();
        response.data = p;
        _updateResponse(response, function () {
            _self.p_returnBasicSuccess(res);
        });
    };

    // for client/play/classes/framework/mapping/MapMain.js, ycui 04232013
    // FUNCTION 1
    var _getTopMechByCommunity = function (req, res) {
        var query = _getQuery(req);
        var limit = query.limit;

        var cObjs = [];
        // get communities (zips)
        _settingDataHandler.getCommunities( function (communities) {
            if (communities) {
                cObjs = communities;
            }
        });

        cObjs.forEach (function (row, i) {
            var zips = row.zips;
            _getMechCountPercForZips(zips, limit, req, res);
        });
    };

    var _getMechCountPercForZips = function (zips, limit, req, res){
        var url_parts = url.parse(req.url, true);
        var query = _getQuery(req);

        // get total mechanisms count for zips (community)
        var total = _getTotalMechCountForZips(zips);

        // get mechanisms count percentage grouped by mechanism for zips (community)
        var counts = _getMechCounts(zips, limit);

        var ans;
        var countObjs = counts.data();
        for (var k in countObjs) {
            countObjs[k] = countObjs[k] / total;
        }
        return countObjs;
    };

    // get total mechanisms count for zips (community)
    var _getTotalMechCountForZips = function (zips) {
        var total;
        zipsByCommunity.forEach(function (zip) {
            _self.p_view('getTotalMechCountForZip', { key: zip }, function (err, totalMechCount) { // count votes for all priorities per ziparea
                total += totalMechCount;
            });
        });
        return total;
    };

    // get mechanisms count percentage grouped by mechanism for zips (community)
    var _getMechCounts = function (zips, limit) {
        zips.forEach(function (zip) {
            _self.p_view('getMechCountForZip', { key: zip }, function (err, body) { // count votes for all priorities per ziparea
                if (body && body.rows) {
                    var mObjs = []; // return: array contains objects
                    body.rows.forEach (function (row) {
                        if (typeof(mObjs[row.value]) != "undefined") { // exist key, http://stackoverflow.com/questions/135448/how-do-i-check-to-see-if-an-object-has-a-property-in-javascript
                            mObjs[row.value] += 1;
                        } else { // not exist key
                            var mObj = {};
                            mObj[row.value] = 1;
                            mObjs.push(mObj);
                        }
                    });

                    // sort & limit of mObjs, http://stackoverflow.com/questions/4969121/in-javascript-is-there-an-easy-way-to-sort-key-value-pairs-by-the-value-and-re
                    var sorted = mObjs.slice(0).sort(function(a, b) {
                        return b.value - a.value; // DESC
                    });
                    var sortedmObjs = [];
                    for (var i = 0; i < limit; i ++) {
                        sortedmObjs[sorted[i].key] = sorted[i].value;
                    }

                    return sortedmObjs;
                }
            });
        });
    };

    // FUNCTION 2
    var _getMechDataByCommunity = function (mechId, req, res){
        var url_parts = url.parse(req.url, true);
        var query = _getQuery(req);

        // get communities (zips)
        _settingDataHandler.getCommunities( function (communities) {
            if (communities) {
                cObjs = communities;
            }
        });

        // get total mechanisms count for zips (community)
        cObjs.forEach (function (row, i) {
            var zips = row.zips;
            _getCountPercForZipsForMech(zips, mechId, req, res);
        });

        // TODO: No. Community, Perc
    };

    var _getCountPercForZipsForMech = function (zips, mechId, req, res){
        var url_parts = url.parse(req.url, true);
        var query = _getQuery(req);

        // get total mechanisms count for zips (community)
        var total = _getTotalMechCountForZips(zips);

        // get mechanism count percentage for zips (community)
        var counts = _getMechCountForZips(zips, limit);

        var ans;
        var countObjs = counts.data();
        for (var k in countObjs) {
            countObjs[k] = countObjs[k] / total;
        }
        return countObjs;

    };

    var getMechCountForZips = function (zips, mechId) {
        zips.forEach(function (zip) {
            _self.p_view('getMechCountForZipMech', { key: [zip, mechId] }, function (err, body) { // count votes for all priorities per ziparea
                if (body && body.rows) {
                    var rowNum = body.rows.length;
                    var perc = 0; // return: percentage
                    body.rows.forEach (function (row) {
                        perc += row.value;
                    });
                    _self.p_returnJsonObj(res, perc);
                }
            });
        });
    };

    // FUNCTION 3
    var _getCommunityData = function (communityName, req, res){
        var cObjs;
        // get communities (zips)
        _settingDataHandler.getCommunity(communityName, function (communities) {
            if (communities) {
                cObjs = community;
            }
        });

        cObjs.forEach (function (row, i) {
            var zips = row.zips;
            _getMechCountPercForZips(zips, limit, req, res);
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

    // for client/play/classes/framework/mapping/MapMain.js, ycui 04232013
    this.getTopMechByCommunity = function (req, res, postData){ // like 'getActions'    TODO: changes all
        _getTopMechByCommunity(req, res);
    };

    this.getMechDataByCommunity = function (req, res, postData) {
        var dataObj = JSON.parse(postData.data);
        _getMechDataByCommunity(dataObj, req, res);
    };

    this.getCommunityData = function (req, res, postData) {
        var dataObj = JSON.parse(postData.data);
        _getCommunityData(dataObj, req, res);
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
