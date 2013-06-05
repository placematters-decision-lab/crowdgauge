var webpage = require('webpage');
var system = require('system');
var Routes = require('./Routes.js');
var app = new Routes();

if (system.args.length <= 1) {
    console.log('Usage: server-phantom.js <base url>');
    phantom.exit();
}

var baseURL = system.args[1];

var viewportSize = {width: 500, height: 500};//could have one preloaded page for each size then match that to the incoming request...?
var queue = [];
var busy = true;
var _activePage = null;
var _processNext = function () {
    console.log('_processNext: ' + busy + ':' + queue.length);
    if (busy || queue.length == 0) return;
    var r = queue.shift();
    busy = true;
    _processRequest(r.req, r.res, function () {
        busy = false;
        _processNext();
    });
};

var _processRequest = function (req, res, callback) {
    console.log('_processRequest: ' + req.post.responseData);
    if (req.post.responseData == null) {
        res.send(400);//bad request
        return;
    }

    _activePage.onCallback = function (data) {
        //console.log('CALLBACK: ' + JSON.stringify(data));  // Prints 'CALLBACK: { "hello": "world" }'
        console.log('----CLICK---- screenshot taken');
        page.clipRect = { top: 0, left: 0, width: viewportSize.width, height: viewportSize.height };
        var base64Data = page.renderBase64('png');
        res.send(base64Data);
        if (callback) callback();
    };

    var escaped = req.post.responseData.replace(/"/g, '\\"');
    var fnBody = 'SAS.mainInstance.loadResponse("' + escaped + '")';
    //console.log(fnBody);
    _activePage.evaluate(new Function(fnBody));
};

var page = webpage.create();
_activePage = page;

page.viewportSize = viewportSize;
page.onConsoleMessage = function (msg) {
    console.log('CONSOLE>' + msg);
};
page.open(baseURL+'/client/phantom/bubbleChart.html', function (status) {
    console.log('Open: ' + status);
    busy = false;
    _processNext();
});

app.post('/png', function (req, res) {
    queue.push({req: req, res: res});
    _processNext();
});

app.listen(8000);

console.log('PhantomJS listening on port 8000, talking to '+baseURL);