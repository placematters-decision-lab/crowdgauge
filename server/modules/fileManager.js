//region includes
var fs = require("fs");
var url = require('url');
var imageMagick = require('imagemagick');
var formidable = require('formidable');

var fileUploader = require("./fileUploader");

/** @type ImageDataHandler */
var dataHandler = require("./imageDataHandler.js");
//endregion

/**
 @module fileManager
 @class FileManager
 */
FileManager = function () {
    var _self = this;

    var _options = {
        imageTypes:/\.(gif|jpe?g|png)$/i,
        imageVersions:{
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
        uploadDir: ""
    };

    var _handleResult = function (req, res, result) {
        res.writeHead(200, {
            'Content-Type':req.headers.accept
                .indexOf('application/json') !== -1 ?
                'application/json' : 'text/plain'
        });
        res.end(JSON.stringify(result));
    };

    //region public API
    this.handleUpload = function (req, res, postData) {
        var uploader = new fileUploader.FileUploader(_options);
        uploader.handleUpload(req, res);
    };

    this.deletefile = function (req, res, postData) {
        var name = postData.name;
        console.log("DELETE: "+name);
        dataHandler.deleteFile(postData.groupId, postData.name, function(success) {
            return _handleResult(req, res, "OK");
        });
    };

    this.listFiles = function (req, res, postData) {
        var pathname = url.parse(req.url).pathname;
        var groupId = pathname.substr(pathname.lastIndexOf("/") + 1);
        dataHandler.listFiles(groupId, function (files) {
            var list = [];
            files.forEach(function (file, i) {
                list.push({
                    name:file.filename,
                    thumbnail_url:"/files/thumbnail/" + file.filename
                });
            });
            _handleResult(req, res, list);
        });
    };

    /**
     * supports serving files from dataHandler (either as files/<version>/<filename> or as files/<filename> using default version.
     * @param req
     * @param res
     * @param postData
     */
    this.serveFile = function (req, res, postData) {
        var pathname = url.parse(req.url).pathname;
        var file = pathname.substr(pathname.indexOf("/", 1) + 1);
        var sepPos = file.indexOf("/");
        if (sepPos < 0) {
            dataHandler.serveAttachment(file, 'panel', req, res);
        } else {
            dataHandler.serveAttachment(file.substring(sepPos + 1), file.substring(0, sepPos), req, res);
        }
    };

    this.options = function (options) {
        Object.keys(options).forEach(function (k) {
            _options[k] = options[k];
        });
    };
    //endregion


};

module.exports = new FileManager();