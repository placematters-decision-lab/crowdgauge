//region node.js core
var http = require("http");
var path = require('path');
var url = require("url");
var util = require("util");

//endregion
//region npm modules

//endregion
//region modules

//endregion

/**
 @class PhantomProxy
 */
PhantomProxy = function () {
    var _self = this;

    //region private fields and methods

    var _httpRequest = function (options, callback) {
        if (!options.headers) options.headers = {};
        var http_req = http.request(options, function (http_res) {
            var data = '';
            http_res.on('data', function (d) {
                data += d;
            });
            http_res.on('end', function () {
                if (callback) callback(data);
            });
        });
        http_req.on('error', function (e) {
            console.log("Error : " + e.message + "  - options: " + util.inspect(options));
        });
        http_req.end();
    };

    var _phantomize = function (req, res) {
        var opts = {host: 'localhost', port: 8000, path: '/png'};
        _httpRequest(opts, function(data) {
            res.writeHeader(200, {"Content-Type": "image/png"});
            res.write(new Buffer(data, 'base64'));
            res.end();
        });
    };

    //endregion

    //region public API
    this.png = function (req, res, postData) {
        _phantomize(req, res);
    };
    //endregion

};

module.exports = new PhantomProxy();

