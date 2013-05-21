//region includes
var fs = require("fs");
var url = require('url');
var imageMagick = require('imagemagick');
var formidable = require('formidable');

var fileUploader = require("./fileUploader");

/** @type SVGHandler */
var svgHandler = require("./svgHandler");
//endregion

/**
 @module fileManager
 @class FileManager
 */
var FileManager = function () {
    var _self = this;

    var _imageDataHandler;

    var _options = {
        bitmapTypes:/\.(gif|jpe?g|png)$/i,
        vectorImageTypes:/\.(svg)$/i,
        bitmapVersions:{
            'thumbnail':{//--make sure to (manually) create a folder for each of these in temp
                width:120,
                height:120
            },
            'panel':{
                width:400,
                height:300
            }
        },
        accessControl:{
            allowOrigin:'*',
            allowMethods:'OPTIONS, HEAD, GET, POST, PUT, DELETE'
        },
        uploadDir:""
    };

    var _handleResult = function (req, res, result) {
        var ct = req.headers.accept.indexOf('application/json') !== -1 ? 'application/json' : 'text/plain';
        _returnData(req, res, ct, JSON.stringify(result));
    };

    var _returnData = function (req, res, contentType, data) {
        res.writeHead(200, {
            'Content-Type':contentType
        });
        res.end(data);
    };

    //region public API
    this.handleUpload = function (req, res, postData) {
        var uploader = new fileUploader.FileUploader(_options);
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
                    name:file.filename,
                    thumbnail_url:"/files/" + thumbnailPath + file.filename
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
                    name:file.filename,
                    thumbnail_url:"/files/" + thumbnailPath + file.filename
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
        var version = (sepPos < 0) ? (_options.bitmapTypes.test(filename) ? 'panel' : 'main')
            : file.substring(0, sepPos);
        if (_options.vectorImageTypes.test(file)) {
            var color = urlObj.query["color"];
            if (color && color !== "black") {
                _imageDataHandler.loadAttachment(filename, version, function (body) {
                    var data = svgHandler.applyFillColor(body.toString(), color);
                    _returnData(req, res, "image/svg+xml", data);
                });//else fall through to straight-up serveAttachment below
                return;
            }
        }
        _imageDataHandler.serveAttachment(filename, version, req, res);
    };

    this.options = function (options) {
        Object.keys(options).forEach(function (k) {
            _options[k] = options[k];
        });
    };

    this.setHandlers = function (imageDataHandler) {
        _imageDataHandler = imageDataHandler;
    };
    //endregion


};

module.exports = new FileManager();