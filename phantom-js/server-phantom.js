var page = require('webpage').create(),
    Routes = require('./Routes.js'),
    app = new Routes();

page.viewportSize = {width: 500, height: 500};
page.open('http://localhost:8080/client/phantom/bubbleChart.html');

app.get('/png', function(req, res) {
    console.log('png get req received');
    //page.render('got.png');
    var base64Data = page.renderBase64('png');
    res.send(base64Data);
});

app.listen(8000);

console.log('PhantomJS listening on port 8000.');