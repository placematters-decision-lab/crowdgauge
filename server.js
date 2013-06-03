var path = require('path');
var nodeStatic = require('node-static');

var config = require("./server/config");

//var nano = require('nano')(config.couchURL);
//var _db = nano.db.use('foo');

var server = require("./server/http/server");
var router = require("./server/http/router");
/** @type ContributeDataHandler */
var dataHandler = require("./server/modules/dataHandlers/contributeDataHandler");
/** @type ResponseDataHandler */
var responseDataHandler = require("./server/modules/dataHandlers/responseDataHandler");
/** @type SettingDataHandler */
var settingDataHandler = require("./server/modules/dataHandlers/settingDataHandler");
/** @type ImageDataHandler */
var imageDataHandler = require("./server/modules/dataHandlers/imageDataHandler");
/** @type FileManager */
var fileManager = require("./server/modules/fileManager");
/** @type SocketHandler*/
var socketHandler = require("./server/modules/socketHandler");
var personaServer = require("./server/modules/personaServer");
var persistentStore = require("./server/modules/persistentStore");

require('http').globalAgent.maxSockets = 100000;//allow plenty of connections for long-running Couch calls
require('https').globalAgent.maxSockets = 1000;//mostly for loggly

var persist = new persistentStore.PersistentStore();
var ps = new personaServer.PersonaServer(persist, {
    audience: config.appURL
});

// set Handlers
fileManager.setHandlers(imageDataHandler, persist);
dataHandler.setHandlers(socketHandler, imageDataHandler);
responseDataHandler.setHandlers(settingDataHandler);

//var client = path.resolve(__dirname, "client");
var file = new (nodeStatic.Server)(__dirname);
fileManager.options({
    uploadDir: __dirname + '/tmp',
    cacheDir: __dirname + '/tmp/cache'
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
handle["/deleteCell"] = dataHandler.deleteCell;
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
handle["/getAllActions"] = dataHandler.getAllActions;

handle["/saveResponse"] = responseDataHandler.saveResponse;
handle["/getResponse"] = responseDataHandler.getResponse;
handle["/getMechCountForZip"] = responseDataHandler.getMechCountForZip;
handle["/getPriCountForZip"] = responseDataHandler.getPriCountForZip;

handle["/getLocations"] = settingDataHandler.getLocations;

handle["/persona_login"] = ps.login;
handle["/persona_logout"] = ps.logout;

handle["/png"] = responseDataHandler.png;

handle["/health"] = function (req, res, postData) {
    //--just a server health check for load balancer
    res.writeHeader(200, {"Content-Type": "application/json"});
    res.write(JSON.stringify({success:true}));
    res.end();
};

//handle["/TEMP_fixLangs"] = dataHandler.TEMP_fixLangs();

//handle["/upload"] = requestHandlers.upload;
config.ifLocal(null, function() {
    process.on('uncaughtException', function (err) {
        console.log('****************** uncaught exception:' + err);
    });
});

server.start(router.route, securePaths, prehandle, handle, file, persist);
server.startSockets(socketHandler.onConnect);

//--test child process (running from monit)
//console.log('---testing exec');
//var exec = require('child_process').exec;
//exec('echo foo', function (err, stdout, stderr) {
//    console.log('---testing exec stdout:', stdout);
//});
//
//console.log('---testing spawn');
//var echo_proc = require('child_process').spawn(config.ifLocal('cmd', 'bash'));
//echo_proc.stdout.setEncoding("utf8");
//echo_proc.stdout.on('data', function (data) {
//    console.log('---testing spawn: echo>' + data);
//});
//setTimeout(function () {
//    console.log('Sending stdin to echo_proc');
//    echo_proc.stdin.write('bar2');
//    echo_proc.stdin.end();
//}, 1000);

//----start phantomJS
//var baseUrl = 'http://localhost:' + config.port;
var baseUrl = 'http://127.0.0.1:' + config.port;
var childproc = require('child_process');

config.doIfLocal(function () {
    var phantom_proc = childproc.spawn('phantomjs', ['phantom-js/server-phantom.js', baseUrl]);
    phantom_proc.stdout.setEncoding("utf8");
    phantom_proc.stdout.on('data', function (data) {
        console.log('phantom>' + data);
    });
}, function () {
    var binPath = '/usr/local/bin/phantomjs';
    var phantomJsPath = path.join(__dirname, 'phantom-js/server-phantom.js');
    var childArgs = [phantomJsPath, baseUrl];

    console.log(binPath + ' ' + phantomJsPath + ' ' + baseUrl);

    childproc.execFile(binPath, childArgs, function (err, stdout, stderr) {
        if (err) console.log('phantom err>' + err);
        if (stdout) console.log('phantom stdout>' + stdout);
        if (stderr) console.log('phantom stderr>' + stderr);
    });
});