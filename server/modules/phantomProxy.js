//region node.js core
var http = require("http");
var path = require('path');
var url = require("url");
var util = require("util");
var querystring = require('querystring');
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

    var _httpRequest = function (options, postObj, callback) {
        if (!options.headers) options.headers = {};
        var post_data = querystring.stringify(postObj);

        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        options.headers['Content-Length'] = post_data.length;
        options.method = 'POST';

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
        http_req.write(post_data);
        http_req.end();
    };

    var _phantomize = function (res, data) {
        var opts = {host: 'localhost', port: 8000, path: '/png'};
        _httpRequest(opts, data, function (pngData) {
            res.writeHeader(200, {"Content-Type": "image/png"});
            res.write(new Buffer(pngData, 'base64'));
            res.end();
        });
    };

    //endregion

    //region public API
    this.png = function (res, responseData) {
        _phantomize(res, {responseData: JSON.stringify(responseData)});
    };
    //endregion

};

module.exports = new PhantomProxy();

