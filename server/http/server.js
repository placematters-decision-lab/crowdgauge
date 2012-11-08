//region nodejs core
var http = require("http");
var url = require("url");
var qs = require('querystring');
//endregion
//region dependencies
var io = require("socket.io");
//endregion
//region modules
var logger = require("../modules/logger");
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
        persistentStore.checkAuthorization(req, function(success) {
            if (callback) callback(success);
        });
    } else {
        callback(true);
    }
};

function start(route, securePaths, prehandle, handle, staticServer, persistentStore) {

    function onRequest(req, res) {
        var postDataStr = "";
        var pathname = url.parse(req.url).pathname;
        logger.log('Request for ' + pathname + ' received.');
        if (route(prehandle, pathname, req, res, {})) return;

        req.setEncoding("utf8");
        req.addListener("data", function (postDataChunk) {
            postDataStr += postDataChunk;
        });
        req.addListener("end", function () {
            var postData = qs.parse(postDataStr);
            _checkAuthorization(req, pathname, securePaths, persistentStore, function (success) {
                if (success) {
                    //TODO create test to ensure that all possible routes that resolve in 'route' function are checked by securePaths
                    if (!route(handle, pathname, req, res, postData)) {
                        staticServer.serve(req, res);
                    }
                } else {
                    res.writeHead(302, {
                        'Location': '/client/login/index.html'
                        //add other headers here...
                    });
                    res.end();
                    //--if its a web service call, then it should probably not redirect... but there is no way to determine this here?
                    //res.writeHead(403);
                    //res.end('Sorry you are not authorized.');
                }
            });
        });
    }

    app = http.createServer(onRequest);
    app.listen(8080);//, '127.0.0.1');
    console.log('Server running at http://127.0.0.1:8080/');
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