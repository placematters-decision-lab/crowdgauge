/**
 * User: KGoulding
 * Date: 9/25/12
 * Time: 11:51 AM
 */

var path = require('path');
var fs = require('fs');
var url = require("url");
// Since Node 0.8, .existsSync() moved from path to fs:
var _existsSync = fs.existsSync || path.existsSync;
var formidable = require('formidable');
var nodeStatic = require('node-static');
var imageMagick = require('imagemagick');

/** @type ServerDataHandler */
var dataHandler = require("./dataHandler");

var options = {
    tmpDir:__dirname + '/tmp',
    publicDir:__dirname + '/public',
    uploadDir:__dirname + '/tmp',
    uploadUrl:'/files/',
    listfilesUrl:'/listfiles/',
    maxPostSize:11000000000, // 11 GB
    minFileSize:1,
    maxFileSize:10000000000, // 10 GB
    acceptFileTypes:/.+/i,
    // Files not matched by this regular expression force a download dialog,
    // to prevent executing any scripts in the context of the service domain:
    staticFileTypes:/\.(html|css|js)$/i,
    safeFileTypes:/\.(gif|jpe?g|png)$/i,
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
    /* Uncomment and edit this section to provide the service via HTTPS:
     ssl: {
     key: fs.readFileSync('/Applications/XAMPP/etc/ssl.key/server.key'),
     cert: fs.readFileSync('/Applications/XAMPP/etc/ssl.crt/server.crt')
     },
     */
    nodeStatic:{
        cache:3600 // seconds to cache served files
    }
};
var fileServer;
var setOptions = function (opts) {
    for (var k in opts) {
        options[k] = opts[k];
    }
    _setupFileServer();
};
var _setupFileServer = function () {
    fileServer = new nodeStatic.Server(options.publicDir, options.nodeStatic);
    fileServer.respond = function (pathname, status, _headers, files, stat, req, res, finish) {
        if (!options.safeFileTypes.test(files[0])) {
            if (!options.staticFileTypes.test(files[0])) {
                // Force a download dialog for unsafe file extensions:
                res.setHeader(
                    'Content-Disposition',
                    'attachment; filename="' + utf8encode(path.basename(files[0])) + '"'
                );
            }
        } else {
            // Prevent Internet Explorer from MIME-sniffing the content-type:
            res.setHeader('X-Content-Type-Options', 'nosniff');
        }
        nodeStatic.Server.prototype.respond
            .call(this, pathname, status, _headers, files, stat, req, res, finish);
    };
};

var utf8encode = function (str) {
    return unescape(encodeURIComponent(str));
};

var nameCountRegexp = /(?:(?: \(([\d]+)\))?(\.[^.]+))?$/;
var nameCountFunc = function (s, index, ext) {
    return ' (' + ((parseInt(index, 10) || 0) + 1) + ')' + (ext || '');
};
var FileInfo = function (file) {
    this.name = file.name;
    this.size = file.size;
    this.type = file.type;
    this.delete_type = 'DELETE';
};
var UploadHandler = function (req, res, callback) {
    this.req = req;
    this.res = res;
    this.callback = callback;//@see handleResult
};
var serve = function (req, res) {
    console.log(req.method+" : "+req.url);
    res.setHeader(
        'Access-Control-Allow-Origin',
        options.accessControl.allowOrigin
    );
    res.setHeader(
        'Access-Control-Allow-Methods',
        options.accessControl.allowMethods
    );
    var handleResult = function (result, redirect) {
            if (redirect) {
                res.writeHead(302, {
                    'Location':redirect.replace(
                        /%s/,
                        encodeURIComponent(JSON.stringify(result))
                    )
                });
                res.end();
            } else {
                res.writeHead(200, {
                    'Content-Type':req.headers.accept
                        .indexOf('application/json') !== -1 ?
                        'application/json' : 'text/plain'
                });
                res.end(JSON.stringify(result));
            }
        },
        setNoCacheHeaders = function () {
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
            res.setHeader('Content-Disposition', 'inline; filename="files.json"');
        },
        handler = new UploadHandler(req, res, handleResult);
    switch (req.method) {
        case 'OPTIONS':
            res.end();
            break;
        case 'HEAD':
        case 'GET':
            if (req.url === '/') {
                setNoCacheHeaders();
                if (req.method === 'GET') {
                    handler.get();
                } else {
                    res.end();
                }
            } else {
                var pathname = url.parse(req.url).pathname;
                if (pathname.indexOf(options.uploadUrl) == 0) {
                    var file = pathname.substring(options.uploadUrl.length);
                    var sepPos = file.indexOf("/");
                    if (sepPos < 0) {
                        dataHandler.serveAttachment(file, 'panel', req, res);
                    } else {
                        dataHandler.serveAttachment(file.substring(sepPos + 1), file.substring(0, sepPos), req, res);
                    }
                } else if (pathname.indexOf(options.listfilesUrl) == 0) {
                    var mechId = pathname.substring(options.listfilesUrl.length);
                    dataHandler.listFiles(mechId, function (files) {
                        var list = [];
                        files.forEach(function (file, i) {
                            list.push({
                                name:file.filename,
                                thumbnail_url:"/files/thumbnail/" + file.filename
                            });
                        });
                        handleResult(list);
                    });
                } else {
                    fileServer.serve(req, res);
                }
            }
            break;
        case 'POST':
            setNoCacheHeaders();
            handler.post();
            break;
        case 'DELETE':
            handler.destroy();
            break;
        default:
            res.statusCode = 405;
            res.end();
    }
};

FileInfo.prototype.validate = function () {
    if (options.minFileSize && options.minFileSize > this.size) {
        this.error = 'minFileSize';
    } else if (options.maxFileSize && options.maxFileSize < this.size) {
        this.error = 'maxFileSize';
    } else if (!options.acceptFileTypes.test(this.name)) {
        this.error = 'acceptFileTypes';
    }
    return !this.error;
};
FileInfo.prototype.safeName = function () {
    // Prevent directory traversal and creating hidden system files:
    this.name = path.basename(this.name).replace(/^\.+/, '');
    // Prevent overwriting existing files:
    while (_existsSync(options.uploadDir + '/' + this.name)) {
        this.name = this.name.replace(nameCountRegexp, nameCountFunc);
    }
};
FileInfo.prototype.initUrls = function (req) {
    if (!this.error) {
        var that = this,
            baseUrl = (options.ssl ? 'https:' : 'http:') +
                '//' + req.headers.host + options.uploadUrl;
        this.url = this.delete_url = baseUrl + encodeURIComponent(this.name);
        Object.keys(options.imageVersions).forEach(function (version) {
            that[version + '_url'] = baseUrl + version + '/' +
                encodeURIComponent(that.name);
        });
    }
};
UploadHandler.prototype.get = function () {
    var handler = this,
        files = [];
    fs.readdir(options.uploadDir, function (err, list) {
        list.forEach(function (name) {
            var stats = fs.statSync(options.uploadDir + '/' + name),
                fileInfo;
            if (stats.isFile()) {
                fileInfo = new FileInfo({
                    name:name,
                    size:stats.size
                });
                fileInfo.initUrls(handler.req);
                files.push(fileInfo);
            }
        });
        handler.callback(files);
    });
};
UploadHandler.prototype.post = function () {
    var handler = this;
    var form = new formidable.IncomingForm();
    var tmpFiles = [];
    var files = [];
    var map = {};
    var counter = 1;
    var redirect;
    var finished = 0;
    var finish = function (callback) {
        finished++;
        if (finished<2) return;//--both the upload and the db updates must be complete
        files.forEach(function (fileInfo) {
            fileInfo.initUrls(handler.req);
        });
        handler.callback(files, redirect);
        if (callback) callback();
    };
    var saveVersion = function (docId, version, path, callback) {
        dataHandler.saveAttachment(docId, version, path, function (success) {
            if (success) {
                fs.unlink(path, function (err) {
                    if (callback) callback(err === null);
                });
                //fs.unlinkSync(path);//delete the file once successfully stored in couchDB
            }
        });
    };

    form.uploadDir = options.tmpDir;
    form.on('fileBegin',function (name, file) {
        tmpFiles.push(file.path);
        var fileInfo = new FileInfo(file, handler.req, true);
        fileInfo.safeName();
        map[path.basename(file.path)] = fileInfo;
        files.push(fileInfo);
    }).on('field',function (name, value) {
            if (name === 'redirect') {
                redirect = value;
            }
        }).on('file',function (name, file) {
            var fileInfo = map[path.basename(file.path)];
            fileInfo.size = file.size;
            if (!fileInfo.validate()) {
                fs.unlink(file.path);
                return;
            }
            //fs.renameSync(file.path, options.uploadDir + '/' + fileInfo.name);
            if (options.imageTypes.test(fileInfo.name)) {
                console.log("File Added: " + fileInfo.name);
                dataHandler.saveDocument({groupId:name, filename:fileInfo.name}, function (docId) {
                    console.log("couch doc added: " + docId);
                    var vCnt = 0;
                    Object.keys(options.imageVersions).forEach(function (version) {
                        vCnt += 1;
                        console.log("counter++ " + vCnt);
                        var opts = options.imageVersions[version];
                        var outputFile = options.uploadDir + '/' + version + '/' + fileInfo.name;
                        console.log("Converting: " + file.path + " to " + outputFile);
                        imageMagick.resize({
                            width:opts.width,
                            height:opts.height,
                            srcPath:file.path,
                            dstPath:outputFile
                        }, function (err, stdout, stderr) {
                            if (err) throw err;
                            //--add image to couch as attachment
                            saveVersion(docId, version, outputFile, function () {
                                vCnt -= 1;
                                console.log("counter-- " + vCnt);
                                if (vCnt == 0) {
                                    console.log("All done and saved");
                                    //    saveVersion(docId, "main", file.path);//--add (and delete) the original one last because its used to create the other images.
                                    fs.unlink(file.path, function (err) {
                                        if (err) throw err;
                                    });
                                    finish();
                                }
                            });
                        });
                    });
                });
            }
        }).on('aborted',function () {
            tmpFiles.forEach(function (file) {
                fs.unlink(file);
            });
        }).on('error',function (e) {
            console.log(e);
        }).on('progress',function (bytesReceived, bytesExpected) {
            if (bytesReceived > options.maxPostSize) {
                handler.req.connection.destroy();
            }
        }).on('end', function() {
            finish();
        })
        .parse(handler.req);
};
UploadHandler.prototype.destroy = function () {
    var handler = this,
        fileName;
    if (handler.req.url.slice(0, options.uploadUrl.length) === options.uploadUrl) {
        fileName = path.basename(decodeURIComponent(handler.req.url));
        fs.unlink(options.uploadDir + '/' + fileName, function (ex) {
            Object.keys(options.imageVersions).forEach(function (version) {
                fs.unlink(options.uploadDir + '/' + version + '/' + fileName);
            });
            handler.callback(!ex);
        });
    } else {
        handler.callback(false);
    }
};

exports.serve = serve;
exports.setOptions = setOptions;