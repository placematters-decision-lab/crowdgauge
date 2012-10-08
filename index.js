var path = require('path');
var nodeStatic = require('node-static');

var server = require("./server/http/server");
var router = require("./server/http/router");
/** @type ServerDataHandler */
var dataHandler = require("./server/modules/serverDataHandler");
/** @type ImageDataHandler */
var imageDataHandler = require("./server/modules/imageDataHandler.js");
/** @type FileManager */
var fileManager = require("./server/modules/fileManager");
/** @type SocketHandler*/
var socketHandler = require("./server/modules/socketHandler");

fileManager.setHandlers(imageDataHandler);
dataHandler.setHandlers(socketHandler, imageDataHandler);

//var client = path.resolve(__dirname, "client");
var file = new(nodeStatic.Server)(__dirname);
fileManager.options({
    uploadDir:__dirname + '/tmp'
});

var prehandle = {};
prehandle["/fileupload"] = fileManager.handleUpload;

var handle = {};
handle["/addPriority"] = dataHandler.addPriority;
handle["/takeLock"] = dataHandler.takeLock;
handle["/releaseLock"] = dataHandler.releaseLock;
handle["/addMechanism"] = dataHandler.addMechanism;
handle["/deletePriority"] = dataHandler.deletePriority;
handle["/deleteMechanism"] = dataHandler.deleteMechanism;
handle["/getAllContent"] = dataHandler.getAllContent;
handle["/updateContent"] = dataHandler.updateContent;

handle["/listfiles"] = fileManager.listFiles;
handle["/deletefile"] = fileManager.deletefile;
handle["/files"] = fileManager.serveFile;
handle["/getImage"] = fileManager.getImage;

handle["/getPriorities"] = dataHandler.getPriorities;
handle["/getMechanisms"] = dataHandler.getMechanisms;

//handle["/upload"] = requestHandlers.upload;
server.start(router.route, prehandle, handle, file);
server.startSockets(socketHandler.onConnect);