$(document).ready(function() {
//    var socket = io.connect('http://localhost');

    var socket = io.connect();
    socket.on('updateUI', function (data) {
        matrix.updateGrid(data);
    });
    socket.on('lockStateChanged', function (data) {
        matrix.lockStateChanged(data);
    });

    var matrix = new SAS.MatrixUI($("#holder"), socket);
    matrix.createUI();

});
