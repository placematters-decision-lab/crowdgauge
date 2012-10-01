//region includes
var fs = require("fs");
var url = require('url');
var path = require('path');

var imageMagick = require('imagemagick');
var formidable = require('formidable');

/** @type ImageDataHandler */
var dataHandler = require("./imageDataHandler");
var fileUploader = require("./fileUploader");

//temp
var util = require('util');
//endregion

/**
 @class FileUploader
 */
FileUploader = function (options) {
    var _self = this;

    var _options = options;
    var _files = [];
    var _fileUploadEnded = false;
    var _filesStored = false;
    var _res;
    var _req;

    var _handleUpload = function () {
//        var form = new formidable.IncomingForm();
//        form.parse(_req, function(err, fields, files) {
//            _res.writeHead(200, {'content-type': 'text/plain'});
//            _res.write('received upload:\n\n');
//            _res.end(util.inspect({fields: fields, files: files}));
//        });
        var form = new formidable.IncomingForm();
        form.uploadDir = _options.uploadDir;
        console.log("uploadDir:" + _options.uploadDir);
        form.on('fileBegin', _frmFileBegin)
            .on('field', _frmField)
            .on('file', _frmFile)
            .on('aborted', function () {
                console.log("aborted");
            })
            .on('error', function (e) {
                console.log("error" + e);
            })
            .on('progress', function (bytesReceived, bytesExpected) {
                //console.log("received:" + bytesReceived);
            })
            .on('end', function () {
                _fileUploadEnded = true;
                _finish();
            });
        form.parse(_req);
    };

    var _saveVersion = function (docId, version, path, callback) {
        dataHandler.saveAttachment(docId, version, path, function (success) {
            if (success) {
                fs.unlink(path, function (err) {
                    if (callback) callback(err === null);
                });
                //fs.unlinkSync(path);//delete the file once successfully stored in couchDB
            }
        });
    };

    var _finish = function () {
        if (!_fileUploadEnded) return;
        if (!_filesStored) return;
        var list = [];
        _files.forEach(function (file, i) {
            list.push({
                name:file.name,
                thumbnail_url:"/files/thumbnail/" + file.name
            });
        });
        _handleResult(list);
    };

    var _setNoCacheHeaders = function () {
        _res.setHeader('Pragma', 'no-cache');
        _res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        _res.setHeader('Content-Disposition', 'inline; filename="files.json"');
    };

    var _setAccessHeaders = function () {
        _res.setHeader(
            'Access-Control-Allow-Origin',
            options.accessControl.allowOrigin
        );
        _res.setHeader(
            'Access-Control-Allow-Methods',
            options.accessControl.allowMethods
        );
    };

    var _handleResult = function (result) {
        _setAccessHeaders();
        _setNoCacheHeaders();
        _res.writeHead(200, {
            'Content-Type':_req.headers.accept
                .indexOf('application/json') !== -1 ?
                'application/json' : 'text/plain'
        });
        _res.end(JSON.stringify(result));
    };

    var _frmFileBegin = function (name, file) {
        _files.push(file);
    };
    var _frmField = function (name, file) {

    };
    var _frmFile = function (name, file) {
        var filename = file.name;
        if (_options.imageTypes.test(filename)) {
            console.log("File Added: " + filename);
            dataHandler.saveDocument({groupId:name, filename:filename}, function (docId) {
                console.log("couch doc added: " + docId);
                var vCnt = 0;
                Object.keys(_options.imageVersions).forEach(function (version) {
                    vCnt += 1;
                    console.log("counter++ " + vCnt);
                    var opts = _options.imageVersions[version];
                    var outputFile = _options.uploadDir + '/' + version + '/' + filename;
                    console.log("Converting: " + file.path + " to " + outputFile);
                    imageMagick.resize({
                        width:opts.width,
                        height:opts.height,
                        srcPath:file.path,
                        dstPath:outputFile
                    }, function (err, stdout, stderr) {
                        if (err) throw err;
                        //--add image to couch as attachment
                        _saveVersion(docId, version, outputFile, function () {
                            vCnt -= 1;
                            console.log("counter-- " + vCnt);
                            if (vCnt == 0) {
                                console.log("All done and saved");
                                //    saveVersion(docId, "main", file.path);//--add (and delete) the original one last because its used to create the other images.
                                fs.unlink(file.path, function (err) {
                                    if (err) throw err;
                                });
                                _filesStored = true;
                                _finish();
                            }
                        });
                    });
                });
            });
        }
    };

    //region public API
    this.handleUpload = function (req, res) {
        _res = res;
        _req = req;
        _handleUpload();
    };
    //endregion

};

exports.FileUploader = FileUploader;