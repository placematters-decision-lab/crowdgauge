//var path = require('path');
//var jqFileUpload = require("./modules/jqFileUpload");
//var client = path.resolve(__dirname, "../client");
//
//jqFileUpload.setOptions({
//    tmpDir:__dirname + '/tmp',//note: __dirname is specific the the directory containing THIS file
//    uploadDir:__dirname + '/tmp',
//    publicDir:client
//});
//require('http').createServer(jqFileUpload.serve).listen(8888);

var path = require('path');
var nodeStatic = require('node-static');

var server = require("./server/http/server");
var router = require("./server/http/router");
/** @type ServerDataHandler */
var dataHandler = require("./server/modules/dataHandler");
/** @type FileManager */
var fileManager = require("./server/modules/fileManager");
/** @type SocketHandler*/
var socketHandler = require("./server/modules/socketHandler");

//var client = path.resolve(__dirname, "client");
var file = new(nodeStatic.Server)(__dirname);
fileManager.options({
    uploadDir:__dirname + '/tmp'
});

var prehandle = {};
prehandle["/fileupload"] = fileManager.handleUpload;

var handle = {};
handle["/addPriority"] = dataHandler.addPriority;
handle["/addMechanism"] = dataHandler.addMechanism;
handle["/deletePriority"] = dataHandler.deletePriority;
handle["/deleteMechanism"] = dataHandler.deleteMechanism;
handle["/getAllContent"] = dataHandler.getAllContent;
handle["/updateContent"] = dataHandler.updateContent;

handle["/listfiles"] = fileManager.listFiles;
handle["/deletefile"] = fileManager.deletefile;
handle["/files"] = fileManager.serveFile;

//handle["/upload"] = requestHandlers.upload;
server.start(router.route, prehandle, handle, file);
server.startSockets(socketHandler.onConnect);