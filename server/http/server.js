//region nodejs core
var http = require("http");
var url = require("url");
var qs = require('querystring');
var util = require('util');
//endregion
//region dependencies
var io = require("socket.io");
var mu = require('mu2');
//endregion
//region modules
var logger = require("../modules/logger");
var config = require("../config");
//endregion
var app;

var _pathMatch = function (pathname, securePaths) {
    return securePaths.some(function (p, i) {//--use 'some' function to determine if *any* path matches
        return (pathname.indexOf(p) == 0);
    });
};

/**
 * @param req
 * @param pathname
 * @param securePaths
 * @param {PersistentStore} persistentStore
 * @param {Function} callback
 * @private
 */
var _checkAuthorization = function (req, pathname, securePaths, persistentStore, callback) {
    if (_pathMatch(pathname, securePaths)) {
        persistentStore.checkAuthorization(req, function (success) {
            if (callback) callback(success);
        });
    } else {
        callback(true);
    }
};

var _fixPath = function (req, res, pathname, callback) {//--convert invalid paths such as http://foo.com/cat to http://foo.com/cat/index.html
    var pathBits = pathname.split('/');
    var lastAfterSlash = pathBits[pathBits.length - 1];
    var redirectPath = null;
    var playPath = '/client/play/';
    if (lastAfterSlash.indexOf('.') < 0) {
        if (lastAfterSlash == '') {
            if (pathname === '/') {
                redirectPath = playPath;
            } else {
                pathname += 'index.html';
            }

        } else {
            if ('/' + lastAfterSlash === pathname) {//--e.g. we're just sending in '/play'
                redirectPath = playPath;
            } else {
                redirectPath = pathname + '/';
            }
        }
    }
    if (redirectPath) {
        //redirect browser to correct URL
        var url_parts = url.parse(req.url, true);//make sure any URL parameters are passed on
        var query = qs.stringify(url_parts.query);
        if (query) redirectPath += '?' + query;
        res.writeHead(301, {'Location': redirectPath});
        res.end();
    } else {
        callback(pathname);
    }
};

var _getBasicTemplateObj = function (req) {
    var url_parts = url.parse(req.url, true);
    var ans = {
        host: req.headers.host
    };
    Object.keys(url_parts.query).forEach(function (k) {
        ans[k] = url_parts.query[k];
    });
    return ans;
};

var _serveFile = function (req, res, pathname, staticServer) {
    _fixPath(req, res, pathname, function (fixedPath) {
        var ext = fixedPath.split('.').pop();
        if (ext == 'html') {
            var filePath = fixedPath.substr(1);//strip off first '/'
            var fileName = filePath.split('/').pop();
            config.doIfLocal(function () {
                mu.clearCache();//--clear cache otherwise any updates to HTML files will not be reflected
            });
            var stream = mu.compileAndRender(filePath, _getBasicTemplateObj(req));
            util.pump(stream, res);
        } else {
            staticServer.serve(req, res);
        }
    });
};

var _returnError = function (res, code) {
    res.writeHeader(code);
    res.end();
};

function start(route, securePaths, prehandle, handle, staticServer, persistentStore) {
    function onRequest(req, res) {
        var postDataStr = "";
        var pathname = url.parse(req.url).pathname;
        logger.log('Request for ' + pathname + ' received.', 3);
        if (route(prehandle, pathname, req, res, {})) return;

        req.setEncoding("utf8");
        req.addListener("data", function (postDataChunk) {
            postDataStr += postDataChunk;
        });
        req.addListener("end", function () {
            var postData = qs.parse(postDataStr);
            var _redirect = function (res, path) {
                res.writeHead(302, {
                    'Location': path
                });
                res.end();
            };
            _checkAuthorization(req, pathname, securePaths, persistentStore, function (success) {
                if (success) {
                    //TODO create test to ensure that all possible routes that resolve in 'route' function are checked by securePaths
                    if (!route(handle, pathname, req, res, postData)) {
                        if (pathname.indexOf('/server/') == 0) {
                            _returnError(res, 403);//client should not be able to access server files. Security risk! 403 Forbidden
                        } else {
                            _serveFile(req, res, pathname, staticServer);
                        }
                    }
                } else {
                    _redirect(res, '/client/login/');
                    //--if its a web service call, then it should probably not redirect... but there is no way to determine this here?
                    //res.writeHead(403);
                    //res.end('Sorry you are not authorized.');
                }
            });
        });
    }

    app = http.createServer(onRequest);
    app.listen(config.port);//, '127.0.0.1');      // TODO
    console.log('Server running at http://127.0.0.1:' + config.port);
}

function startSockets(onConnect) {
    io = io.listen(app);
    io.set('log level', 1);
    io.sockets.on('connection', function (socket) {
        onConnect(io, socket);
    });
}

exports.start = start;
exports.startSockets = startSockets;