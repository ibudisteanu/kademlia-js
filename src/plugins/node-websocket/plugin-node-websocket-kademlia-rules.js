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
                buffer: bencode.encode( BufferHelper.serializeData([ command, data ] ) ),
            }
        },
        sendSerialized: (id, destContact, command, data, cb) => {

            const buffer = bencode.encode( [0, id, data] );

            const protocol = (destContact.address.protocol === ContactAddressProtocolType.CONTACT_ADDRESS_PROTOCOL_TYPE_SECURED_WEBSOCKET) ? 'wss' : 'ws';
            const address = protocol + '://' + destContact.address.hostname + ':' + destContact.address.port + destContact.address.path;

            let  ws = kademliaRules.webSocketActiveConnectionsMap[address];
            if (!ws)
                ws = kademliaRules.createWebSocket(address, destContact);

            kademliaRules.sendWebSocketWaitAnswer(ws, id, buffer, cb);

        },
        receiveSerialize: (id, srcContact, out ) => {
            return bencode.encode( BufferHelper.serializeData([ 1, id, out] ) )
        },
    }

    kademliaRules.createWebSocket = createWebSocket;
    kademliaRules.sendWebSocketWaitAnswer = sendWebSocketWaitAnswer;
    kademliaRules.initializeWebSocket = initializeWebSocket;

    kademliaRules.socketsQueue = {};

    function createWebSocket(address, srcContact ) {

        const ws = new WebSocket(address, bencode.encode(this._kademliaNode.contact.toArray()).toString('base64'));
        ws._kadInitialized = true;
        ws._queue = [];
        ws.contact = srcContact;

        return this.initializeWebSocket(address, srcContact, ws);
    }

    function initializeWebSocket(address, srcContact, ws) {

        kademliaRules.webSocketActiveConnectionsMap[address] = ws;
        kademliaRules.webSocketActiveConnections.push(ws);

        ws.onopen = () => {

            if (ws._queue) {
                const copy = [...ws._queue];
                ws._queue = [];
                for (const data of copy)
                    sendWebSocketWaitAnswer(ws, data.id, data.buffer, data.cb);
            }

        }
        ws.onclose = () => {

        }

        ws.on('message',  (message) => {

            const decoded = bencode.decode(message);
            const status = decoded[0];
            const id = decoded[1];

            if ( status === 1 ){ //received an answer

                kademliaRules.socketsQueue[id].resolve( null, decoded[2] );
                delete kademliaRules.socketsQueue[id];

            } else {

                this._kademliaNode.rules.receiveSerialized( id, ws.contact, decoded[2], (err, buffer )=>{

                    if (err)
                        return;

                    ws.send(buffer);

                });

            }

        });

        return ws;
    }

    function sendWebSocketWaitAnswer(ws, id, buffer, cb){

        if (ws.readyState !== 1)
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