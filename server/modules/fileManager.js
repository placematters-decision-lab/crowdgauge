//region includes
var path = require('path');

var fs = require("fs");
var url = require('url');
var formidable = require('formidable');

var fileUploader = require("./fileUploader");

/** @type SVGHandler */
var svgHandler = require("./svgHandler");
//endregion

/**
 @module fileManager
 @class FileManager
 */
var FileManager = function (cacheDir) {
    var _self = this;

    var _imageDataHandler;
    var _persist;

    var _options = {
        bitmapTypes: /\.(gif|jpe?g|png)$/i,
        vectorImageTypes: /\.(svg)$/i,
        bitmapVersions: {
            'thumbnail': {//--make sure to (manually) create a folder for each of these in temp
                width: 120,
                height: 120
            },
            'panel': {
                width: 400,
                height: 300
            }
        },
        accessControl: {
            allowOrigin: '*',
            allowMethods: 'OPTIONS, HEAD, GET, POST, PUT, DELETE'
        },
        uploadDir: "",
        cacheDir: ""
    };

    var _handleResult = function (req, res, result) {
        var ct = req.headers.accept.indexOf('application/json') !== -1 ? 'application/json' : 'text/plain';
        _returnData(req, res, ct, JSON.stringify(result));
    };


    var _returnError = function (res, data) {
        res.writeHeader(200, {"Content-Type": "application/json"});
        res.write(JSON.stringify(data));
        res.end();
    };

    var _returnData = function (req, res, contentType, data) {
        res.writeHead(200, {
            'Content-Type': contentType
        });
        res.end(data);
    };

    var _getCacheFilename = function (filename, query, makeDir, callback) {
        var dirName = '';
        Object.keys(query).forEach(function (k, i) {
            if (i > 0) dirName += '_';
            var val = query[k];
            dirName += k + '-' + val;
        });
        var dirPath = path.resolve(_options.cacheDir, dirName);
        var fullFileName = path.resolve(dirPath, filename);
        if (makeDir) {
            fs.exists(dirPath, function (exists) {
                if (exists) {
                    callback(fullFileName);
                } else {
                    fs.mkdir(dirPath, function () {
                        callback(fullFileName);
                    })
                }
            });
        } else {
            callback(fullFileName);
        }
    };

    var _getContentType = function (file) {
        if (_options.vectorImageTypes.test(file)) {
            return "image/svg+xml";
        }
        if (_options.bitmapTypes.test(file)) {
            return "image/png";//TODO figure out correct type!!!
        }
        return 'text/html';
    };

    var _serveFromCache = function (filename, file, query, res, callback) {
        _getCacheFilename(filename, query, false, function (fullFileName) {
            fs.exists(fullFileName, function (exists) {
                if (exists) {
                    var contentType = _getContentType(file);
//                    res.writeHead(200, contentType);
//                    var fileStream = fs.createReadStream(fullFileName);
//                    fileStream.pipe(res);
                    fs.readFile(fullFileName, "utf-8", function (err, file) {
                        if (err) {
                            res.writeHead(404);
                            console.log(err);
                            res.end();
                        } else {
                            res.writeHead(200, { 'Content-Type': contentType });
                            res.write(file);
                            res.end();
                        }
                        //console.log('Served up: ' + fullFileName + ' : ' + contentType);
                    });

                } else {
                    if (callback) callback()
                }
            });
        });

    };
    var _saveToCache = function (filename, query, data) {
        _getCacheFilename(filename, query, true, function (fullFileName) {
            fs.writeFile(fullFileName, data, function (err) {
                if (err) throw err;
                console.log('Saved: ' + fullFileName);
            });
        });
    };

    //region public API
    this.handleUpload = function (req, res, postData) {
        var uploader = new fileUploader.FileUploader(_options, _persist);
        uploader.handleUpload(req, res);
    };

    this.deletefile = function (req, res, postData) {
        var name = postData.name;
        console.log("DELETE: " + name);
        _imageDataHandler.deleteFile(postData.groupId, postData.name, function (success) {
            return _handleResult(req, res, "OK");
        });
    };

    this.listFiles = function (req, res, postData) {
        var pathname = url.parse(req.url).pathname;
        var groupId = pathname.substr(pathname.lastIndexOf("/") + 1);
        _imageDataHandler.listFiles(groupId, function (files) {
            var list = [];
            files.forEach(function (file, i) {
                var thumbnailPath = _options.bitmapTypes.test(file.filename) ? 'thumbnail/' : 'main/';
                list.push({
                    name: file.filename,
                    thumbnail_url: "/files/" + thumbnailPath + file.filename
                });
            });
            _handleResult(req, res, list);
        });
    };

    this.getImage = function (req, res, postData) {
        //return only the first matching image (not all files)
        var pathname = url.parse(req.url).pathname;
        var groupId = pathname.substr(pathname.lastIndexOf("/") + 1);
        _imageDataHandler.listFiles(groupId, function (files) {
            var ans = null;
            files.forEach(function (file, i) {
                if (ans) return;
                var thumbnailPath = _options.bitmapTypes.test(file.filename) ? 'thumbnail/' : 'main/';
                ans = {
                    name: file.filename,
                    thumbnail_url: "/files/" + thumbnailPath + file.filename
                };
                _handleResult(req, res, ans);
            });
        });
    };
    /**
     * supports serving files from dataHandler (either as files/<version>/<filename> or as files/<filename> using default version.
     * @param req
     * @param res
     * @param postData
     */
    this.serveFile = function (req, res, postData) {
        var urlObj = url.parse(req.url, true);
        var pathname = urlObj.pathname;
        var file = pathname.substr(pathname.indexOf("/", 1) + 1);
        var sepPos = file.indexOf("/");
        var filename = (sepPos < 0) ? file : file.substring(sepPos + 1);
        filename = decodeURI(filename);
        if (filename == null) {
            _returnError(res, {success:false, message:'No filename specified'});
            return;
        }
        _serveFromCache(filename, file, urlObj.query, res, function () {
            var version = (sepPos < 0) ? (_options.bitmapTypes.test(filename) ? 'panel' : 'main')
                : file.substring(0, sepPos);
            if (_options.vectorImageTypes.test(file)) {
                var color = urlObj.query["color"];
                if (color && color !== "black") {//else fall through to straight-up serveAttachment below
                    _imageDataHandler.loadAttachment(filename, version, function (body) {
                        var data = svgHandler.applyFillColor(body.toString(), color);
                        _saveToCache(filename, urlObj.query, data);
                        _returnData(req, res, _getContentType(file), data);
                    });
                    return;
                }
            }
            _imageDataHandler.serveAttachment(filename, version, req, res);
        });
    };

    this.options = function (options) {
        Object.keys(options).forEach(function (k) {
            _options[k] = options[k];
        });
    };

    this.setHandlers = function (imageDataHandler, persist) {
        _imageDataHandler = imageDataHandler;
        _persist = persist;
    };
    //endregion


};

module.exports = new FileManager();