var http = require("http");
var url = require("url");
var qs = require('querystring');
var io = require("socket.io");
var app;

function start(route, prehandle, handle, staticServer) {
    function onRequest(request, response) {
        var postDataStr = "";
        var pathname = url.parse(request.url).pathname;

        console.log("Request for " + pathname + " received.");
        if (route(prehandle, pathname, request, response, {})) return;

        request.setEncoding("utf8");

        request.addListener("data", function (postDataChunk) {
            postDataStr += postDataChunk;
//            console.log("Received POST data chunk '"+postDataChunk + "'.");
        });

        request.addListener("end", function () {
            var postData = qs.parse(postDataStr);
            if (!route(handle, pathname, request, response, postData)) {
                staticServer.serve(request, response);
            }
        });

    }

    app = http.createServer(onRequest);
    app.listen(8888);//, '127.0.0.1');
    console.log('Server running at http://127.0.0.1:8888/');
}

function startSockets(onConnect) {
    io = io.listen(app);
    io.sockets.on('connection', function (socket) {
        onConnect(io, socket);
    });
}

exports.start = start;
exports.startSockets = startSockets;