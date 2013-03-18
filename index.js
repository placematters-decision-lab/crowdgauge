var path = require('path');
var nodeStatic = require('node-static');
var fs = require('fs');

var config = require("./server/config");


var server = require("./server/http/server");
var router = require("./server/http/router");
/** @type ContributeDataHandler */
var dataHandler = require("./server/modules/dataHandlers/contributeDataHandler");
/** @type ResponseDataHandler */
var responseDataHandler = require("./server/modules/dataHandlers/responseDataHandler");
/** @type ImageDataHandler */
var imageDataHandler = require("./server/modules/dataHandlers/imageDataHandler");
/** @type FileManager */
var fileManager = require("./server/modules/fileManager");
/** @type SocketHandler*/
var socketHandler = require("./server/modules/socketHandler");
var personaServer = require("./server/modules/personaServer");
var persistentStore = require("./server/modules/persistentStore");

var persist = new persistentStore.PersistentStore();
var ps = new personaServer.PersonaServer(persist, {
    audience:config.appURL
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
    "/takeLock",
    "/releaseLock",
    "/addPriority",
    "/addMechanism",
    "/addAction",
    "/deleteAction",
    "/deletePriority",
    "/deleteMechanism",
    "/updateContent",
    "/deletefile",
    "/client/contribute/index.html"
];//Note: fileManager.handleUpload uses auth automatically (not based on securePaths)

var handle = {};
handle["/addPriority"] = dataHandler.addPriority;
handle["/addAction"] = dataHandler.addAction;
handle["/addMechanism"] = dataHandler.addMechanism;
handle["/takeLock"] = dataHandler.takeLock;
handle["/releaseLock"] = dataHandler.releaseLock;
handle["/deletePriority"] = dataHandler.deletePriority;
handle["/deleteAction"] = dataHandler.deleteAction;
handle["/deleteMechanism"] = dataHandler.deleteMechanism;
handle["/getAllContent"] = dataHandler.getAllContent;
handle["/updateContent"] = dataHandler.updateContent;

handle["/listfiles"] = fileManager.listFiles;
handle["/deletefile"] = fileManager.deletefile;
handle["/files"] = fileManager.serveFile;
handle["/getImage"] = fileManager.getImage;

handle["/getPriorities"] = dataHandler.getPriorities;
handle["/getMechanisms"] = dataHandler.getMechanisms;
handle["/getMechanismInfo"] = dataHandler.getMechanismInfo;
handle["/getActionDefs"] = dataHandler.getActionDefs;
handle["/getActions"] = dataHandler.getActions;

handle["/saveResponse"] = responseDataHandler.saveResponse;

handle["/persona_login"] = ps.login;
handle["/persona_logout"] = ps.logout;

//handle["/TEMP_fixLangs"] = dataHandler.TEMP_fixLangs();

//handle["/upload"] = requestHandlers.upload;
server.start(router.route, securePaths, prehandle, handle, file, persist);
server.startSockets(socketHandler.onConnect);