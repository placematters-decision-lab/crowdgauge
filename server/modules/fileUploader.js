//region nodejs core
var fs = require("fs");
var url = require('url');
var path = require('path');
var util = require('util');
//endregion
//region dependencies
var imageMagick = require('imagemagick');
var formidable = require('formidable');
//endregion
//region modules
/** @type ImageDataHandler */
var dataHandler = require("./dataHandlers/imageDataHandler");
var logger = require("./logger");
var persistentStore = require("./persistentStore");
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
    var _persistentStore = new persistentStore.PersistentStore();

    var _handleUpload = function () {
        //logger.log("(NOT) HANDLING UPLOAD uploadDir:" + _options.uploadDir);
        //return;
//        var form = new formidable.IncomingForm();
//        form.parse(_req, function(err, fields, files) {
//            _res.writeHead(200, {'content-type': 'text/plain'});
//            _res.write('received upload:\n\n');
//            _res.end(util.inspect({fields: fields, files: files}));
//        });
        var form = new formidable.IncomingForm();
        form.uploadDir = _options.uploadDir;
        logger.log("HANDLING UPLOAD uploadDir:" + _options.uploadDir);
        form.on('fileBegin', _frmFileBegin)
            .on('field', _frmField)
            .on('file', _frmFile)
            .on('aborted', function () {
                logger.log("UPLOAD aborted", 1);
            })
            .on('error', function (e) {
                logger.log("UPLOAD error" + e, 1);
            })
            .on('progress', function (bytesReceived, bytesExpected) {
                logger.log("UPLOAD received:" + bytesReceived, 3);
            })
            .on('end', function () {
                _fileUploadEnded = true;
                _finish();
            });
        form.parse(_req);
    };

    var _processFile = function (name, file) {
        var filename = file.name;
        if (_options.vectorImageTypes.test(filename)) {
            dataHandler.saveDocument({groupId:name, filename:filename}, function (docId) {
                logger.log("couch doc added: " + docId);
                _saveVersion(docId, "main", _getContentType(file.path), file.path, function () {
                    _filesStored = true;
                    _finish();
                });
            });
        } else if (_options.bitmapTypes.test(filename)) {
            dataHandler.saveDocument({groupId:name, filename:filename}, function (docId) {
                logger.log("couch doc added: " + docId);
                var vCnt = 0;
                Object.keys(_options.bitmapVersions).forEach(function (version) {
                    vCnt += 1;
                    console.log("counter++ " + vCnt);
                    var opts = _options.bitmapVersions[version];
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
                        _saveVersion(docId, version, 'image/jpeg', outputFile, function () {
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

    var _saveVersion = function (docId, version, contentType, path, callback) {
        dataHandler.saveAttachment(docId, version, contentType, path, function (success) {
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
        //TODO centralize with fileManager.js
        _files.forEach(function (file, i) {
            var thumbnailPath = _options.bitmapTypes.test(file.name) ? 'thumbnail/' : 'main/';
            list.push({
                name:file.name,
                thumbnail_url:"/files/" + thumbnailPath + file.name
            });
        });
        _handleResult(list);
    };

    var _setNoCacheHeaders = function () {
        _res.setHeader('Pragma', 'no-cache');
        _res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        //_res.setHeader('Content-Disposition', 'inline; filename="files.json"');
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
        logger.log("UPLOAD _frmFileBegin", 1);
        _files.push(file);
    };
    var _frmField = function (name, file) {
        logger.log("UPLOAD _frmField", 1);
    };
    var _frmFile = function (name, file) {
        //--it would be good to check authorization before this point, but it seems tricky because our auth check is async
        _persistentStore.checkAuthorization(_req, function (success) {
            if (success) {
                logger.log("UPLOAD File Added: " + file.name);
                _processFile(name, file);
            } else {
                logger.log("UPLOAD File - Access Denied: " + file.name);
                fs.unlink(file.path, function (err) {
                    if (err) throw err;
                    _res.writeHead(403);
                    _res.end('Sorry you are not authorized.');
                });
            }
        });

    };

    var _getContentType = function (path) {
        return "image/svg+xml";
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