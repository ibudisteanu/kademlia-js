module.exports = function (kademliaRules){

    kademliaRules._webSocketActiveConnections = [];

    //Node.js
    if ( typeof window === "undefined" && kademliaRules._kademliaNode.plugins.hasPlugin('PluginNodeHTTP') ){

        const WebSocketServer = require('./web-socket-server')
        kademliaRules._webSocketServer = new WebSocketServer(kademliaRules._kademliaNode, { server: kademliaRules._server });

    }

    function sendSerialized(destContact, command, buffer, cb){

        const id = uuid();
        this._server.write( id, destContact, buffer, cb )

    }

}