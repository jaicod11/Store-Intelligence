const { Server } = require('socket.io');

let _io = null;

function initSocket(httpServer) {
    _io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    _io.on('connection', (socket) => {
        console.log(`🔌  Dashboard connected: ${socket.id}`);
        socket.on('disconnect', () =>
            console.log(`🔌  Dashboard disconnected: ${socket.id}`)
        );
    });

    console.log('✅  Socket.io initialized');
    return _io;
}

function getSocketIO() {
    return _io;
}

module.exports = { initSocket, getSocketIO };