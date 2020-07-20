const ContactAddressProtocolType = require('../../contact/contact-address-protocol-type')
const WebSocket = require('isomorphic-ws')
const Contact = require('../../contact/contact')
const bencode = require('bencode');
const BufferHelper = require('../../helpers/buffer-utils')

module.exports = function (kademliaRules){

    kademliaRules.webSocketActiveConnections = [];
    kademliaRules.webSocketActiveConnectionsMap = {};

    //Node.js
    if ( typeof window === "undefined" && kademliaRules._kademliaNode.plugins.hasPlugin('PluginNodeHTTP') ){

        const WebSocketServer = require('./web-socket-server')
        kademliaRules._webSocketServer = new WebSocketServer(kademliaRules._kademliaNode, { server: kademliaRules._server.server });

    }

    if (ContactAddressProtocolType.CONTACT_ADDRESS_PROTOCOL_TYPE_WEBSOCKET === undefined) throw new Error('WebSocket protocol was not initialized.');
    kademliaRules._protocolSpecifics[ContactAddressProtocolType.CONTACT_ADDRESS_PROTOCOL_TYPE_WEBSOCKET] =
    kademliaRules._protocolSpecifics[ContactAddressProtocolType.CONTACT_ADDRESS_PROTOCOL_TYPE_SECURED_WEBSOCKET] = {
        sendSerialize: (destContact, command, data) => {
            const id = Math.floor( Math.random() * Number.MAX_SAFE_INTEGER );
            return {
                id,
                buffer: bencode.encode( BufferHelper.serializeData([ id, command, data ]) ),
            }
        },
        sendSerialized: (id, destContact, command, buffer, cb) => {

            const protocol = (destContact.address.protocol === ContactAddressProtocolType.CONTACT_ADDRESS_PROTOCOL_TYPE_SECURED_WEBSOCKET) ? 'wss' : 'ws';
            const address = protocol + '://' + destContact.address.hostname + ':' + destContact.address.port + destContact.address.path;

            let  ws = kademliaRules.webSocketActiveConnectionsMap[address];
            if (!ws)
                ws = kademliaRules.createWebSocket(address);

            kademliaRules.sendWebSocketWaitAnswer(ws, id, buffer, cb);

        },
        receiveSerialize: (id, srcContact, out ) => {
            return bencode.encode( BufferHelper.serializeData([id, out]) );
        }
    }

    kademliaRules.createWebSocket = createWebSocket;
    kademliaRules.sendWebSocketWaitAnswer = sendWebSocketWaitAnswer;

    kademliaRules.socketsQueue = {};

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

        ws.on('message',  (message) => {

            if (!ws._kadInitialized){
                const decoded = bencode.decode(message);
                const contact = Contact.fromArray(this._kademliaNode, decoded);
                ws._kadInitialized = true;
                ws.contact = contact;

                const copy = [...ws._queue];
                ws._queue = [];

                for (const data of copy)
                    sendWebSocketWaitAnswer( ws, data.id, data.buffer, data.cb );

            } else {
                const decoded = bencode.decode(message);
                const id = decoded[0];

                kademliaRules.socketsQueue[id].resolve( null, decoded[1] );
                delete kademliaRules.socketsQueue[id];
            }


        });

        return ws;
    }

    function sendWebSocketWaitAnswer(ws, id, buffer, cb){

        if (!ws._kadInitialized)
            ws._queue.push( {id, buffer, cb} );
        else {

            kademliaRules.socketsQueue[id] = {
                time: new Date(),
                resolve: cb,
            }

            ws.send( buffer )
        }

    }

}