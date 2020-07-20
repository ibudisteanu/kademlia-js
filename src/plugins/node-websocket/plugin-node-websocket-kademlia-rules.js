const ContactAddressProtocolType = require('../../contact/contact-address-protocol-type')
const WebSocket = require('isomorphic-ws')
const bencode = require('bencode');
const Contact = require('../../contact/contact')
const uuid = require('uuid').v1;

module.exports = function (kademliaRules){

    kademliaRules.webSocketActiveConnections = [];
    kademliaRules.webSocketActiveConnectionsMap = {};

    //Node.js
    if ( typeof window === "undefined" && kademliaRules._kademliaNode.plugins.hasPlugin('PluginNodeHTTP') ){

        const WebSocketServer = require('./web-socket-server')
        kademliaRules._webSocketServer = new WebSocketServer(kademliaRules._kademliaNode, { server: kademliaRules._server.server });

    }

    if (ContactAddressProtocolType.CONTACT_ADDRESS_PROTOCOL_TYPE_WEBSOCKET === undefined) throw new Error('WebSocket protocol was not initialized.');
    kademliaRules._sendSerializedByProtocol[ContactAddressProtocolType.CONTACT_ADDRESS_PROTOCOL_TYPE_WEBSOCKET] = sendSerialized.bind(kademliaRules);
    kademliaRules._sendSerializedByProtocol[ContactAddressProtocolType.CONTACT_ADDRESS_PROTOCOL_TYPE_SECURED_WEBSOCKET] = sendSerialized.bind(kademliaRules);

    kademliaRules.createWebSocket = createWebSocket;
    kademliaRules.sendWebSocketWaitAnswer = sendWebSocketWaitAnswer;

    function sendSerialized(destContact, command, buffer, cb){

        const protocol = (destContact.address.protocol === ContactAddressProtocolType.CONTACT_ADDRESS_PROTOCOL_TYPE_SECURED_WEBSOCKET) ? 'wss' : 'ws';
        const address = protocol + '://' + destContact.address.hostname + ':' + destContact.address.port + destContact.address.path;

        let  ws = kademliaRules.webSocketActiveConnectionsMap[address];
        if (!ws)
            ws = this.createWebSocket(address);

        this.sendWebSocketWaitAnswer(ws, buffer, cb);

    }

    function createWebSocket(address, cb){

        const ws = new WebSocket( address , bencode.encode( this._kademliaNode.contact.toArray() ).toString('base64') );
        kademliaRules.webSocketActiveConnectionsMap[address] = ws;
        kademliaRules.webSocketActiveConnections.push(ws);

        ws._kadInitialized = false;
        ws._queue = [];

        ws.onopen = () => {

        }
        ws.onclose = () => {

        }

        ws.onmessage = ({data}) => {

            if (!ws._kadInitialized){
                const decoded = bencode.decode(data);
                const contact = Contact.fromArray(this._kademliaNode, decoded);
                ws._kadInitialized = true;
                ws.contact = contact;

                for (const data of ws._queue)
                    ws.send( [data.id,  data.buffer]  )

                ws._queue = [];
            }

        }

        return ws;
    }

    function sendWebSocketWaitAnswer(ws, buffer, cb){

        const id = uuid();

        if (!ws._kadInitialized)
            ws._queue.push( {id, buffer, cb} );
        else
            ws.send( {id, buffer, cb} )

    }

}