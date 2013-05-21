$(document).ready(function () {
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
    matrix.onTabChanged(function (isActions) {
        $("#instructions").accordion("option", "active", (isActions) ? 1 : 0);
    });

    $("#instructions").accordion({
        heightStyle:"content",
        collapsible:true
    });

    $('#btnPlay').button().click(function() {
        document.location.href = '../play/index.html';
    });

});
