const WebSocket = require('ws');

module.exports = class WebSocketServer extends WebSocket.Server {

    constructor(kademliaNode, options) {
        super(options);
        this._kademliaNode = kademliaNode;

        this.on('connection', this.newClientConnection );
        this.on('disconnect', this.clientDisconnect)

    }

    newClientConnection(ws){

        ws.on('message', function incoming(message) {
            console.log('received: %s', message);
        });

        ws.send('something');
    }

    clientDisconnect(ws){

    }

}