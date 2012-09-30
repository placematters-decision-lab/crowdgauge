//region includes

//endregion

/**
 @module socketHandler
 @class SocketHandler
 */
SocketHandler = function () {
    var _self = this;

    var _returnBasicSuccess = function(response) {

    };
    //endregion

    //region public API
    this.onConnect = function (io, socket) {
        //thought: if we don't ever broadcast data with sockets (just events) we probably don't need any authentication for sockets
        socket.on('broadcastUpdate', function (data) {
            io.sockets.emit('updateUI', { });
        });
    };
    //endregion
};

module.exports = new SocketHandler();

