$(document).ready(function() {
//    var socket = io.connect('http://localhost');

    var socket = io.connect();
    socket.on('updateUI', function (data) {
        matrix.updateGrid();
    });

    var matrix = new SAS.MatrixUI($("#holder"), socket);
    matrix.createUI();

});
