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
var personaServer = require("./server/modules/personaServer");
var persistentStore = require("./server/modules/persistentStore");

var persist = new persistentStore.PersistentStore();
var ps = new personaServer.PersonaServer(persist, {
    audience:"http://localhost:8080" // Must match your browser's address bar
});

fileManager.setHandlers(imageDataHandler);
dataHandler.setHandlers(socketHandler, imageDataHandler);

//var client = path.resolve(__dirname, "client");
var file = new (nodeStatic.Server)(__dirname);
fileManager.options({
    uploadDir:__dirname + '/tmp'
});

var prehandle = {};
prehandle["/fileupload"] = fileManager.handleUpload;

var securePaths = [
    "/addPriority",
    "/takeLock",
    "/releaseLock",
    "/addMechanism",
    "/deletePriority",
    "/deleteMechanism",
    "/updateContent",
    "/deletefile",
    "/client/contribute/index.html"
];//Note: fileManager.handleUpload uses auth automatically (not based on securePaths)

var handle = {};
handle["/addPriority"] = dataHandler.addPriority;
handle["/addMechanism"] = dataHandler.addMechanism;
handle["/takeLock"] = dataHandler.takeLock;
handle["/releaseLock"] = dataHandler.releaseLock;
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

handle["/persona_login"] = ps.login;
handle["/persona_logout"] = ps.logout;

//handle["/upload"] = requestHandlers.upload;
server.start(router.route, securePaths, prehandle, handle, file, persist);
server.startSockets(socketHandler.onConnect);