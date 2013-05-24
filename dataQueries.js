var http = require("http");
var path = require('path');
var url = require("url");
var util = require("util");
var fs = require('fs');
var Enums = require('./shared/classes/modules/Enums');

var _httpRequest = function (options, callback) {
    if (!options.headers) options.headers = {};
    //TODO try this for more concurrent connections: options.agent = false;
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

var opts = {host: '127.0.0.1', port: 8080, path: '/getAllContent?filename=' + encodeURIComponent('test1')};
var stream = fs.createWriteStream("C:\\Users\\kgoulding\\Documents\\Clipboard\\crowdgaugeNEO.csv");
stream.once('open', function (fd) {
    _httpRequest(opts, function (data) {
        var arr = JSON.parse(data);
        var mechsById = {};
        var prioritiesById = {};
        arr.forEach(function (/**Content*/d, i) {
            if (d.contentType == Enums.CTYPE_MECH) {
                mechsById[d.structureId.mechanism] = d;
            }
            if (d.contentType == Enums.CTYPE_PRIORITY) {
                prioritiesById[d.structureId.priority] = d;
            }
        });
        var _writeRow = function (vals) {
            var cells = [];
            vals.forEach(function (v, i) {
                if (v) {
                    cells.push(v.replace(/"/g, "\"\""));
                } else {
                    cells.push("");
                }
            });
            stream.write("\"" + cells.join("\",\"") + "\"");
            stream.write("\n");
        };
        arr.forEach(function (/**Content*/d, i) {
            if (d.contentType == Enums.CTYPE_CELL && d.data && d.data.description && d.data.description.en && d.data.description.en.length > 0) {
                var text = d.data.description.en;
                var m = mechsById[d.structureId.mechanism];
                var p = prioritiesById[d.structureId.priority];
                if (m && p) {
                    _writeRow([m.data.title.en, p.data.title.en, text]);
                } else {
                    if (m) {
                        _writeRow([m.data.title.en, '?', text]);
                    } else if (p) {
                        _writeRow(['?', p.data.title.en, text]);
                    } else {
                        console.log('OTHER??? ' + text);
                    }
                }
            }
        });
        stream.end();
    });
});