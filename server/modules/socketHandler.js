//region includes

//endregion

/**
 @module socketHandler
 @class SocketHandler
 */
SocketHandler = function () {
    var _self = this;

    var _io = null;
    //endregion

    //region public API
    this.onConnect = function (io, socket) {
        _io = io;
        //thought: if we don't ever broadcast data with sockets (just events) we probably don't need any authentication for sockets
        socket.on('broadcastUpdate', function (data) {
            _io.sockets.emit('updateUI', data);
        });
    };

    this.broadcastUpdate = function(action, data){
        _io.sockets.emit(action, data);
    };
    //endregion
};

module.exports = new SocketHandler();

