const WebSocket = require('isomorphic-ws')
const ContactAddressProtocolType= require('../../contact/contact-address-protocol-type')
const Contact = require('../../contact/contact')
const bencode = require('bencode');

module.exports = class WebSocketServer extends WebSocket.Server {

    constructor(kademliaNode, options) {
        super(options);
        this._kademliaNode = kademliaNode;

        this.on('connection', this.newClientConnection );

    }

    newClientConnection(ws){

        try{
            const decoded = bencode.decode( Buffer.from( ws.protocol, "base64") );
            const contact = Contact.fromArray(this._kademliaNode, decoded);
            ws._kadInitialized = true;
            ws.contact = contact;
        }catch(err){
            return ws.close();
        }

        const protocol = ( ws.contact.address.protocol === ContactAddressProtocolType.CONTACT_ADDRESS_PROTOCOL_TYPE_SECURED_WEBSOCKET) ? 'wss' : 'ws';
        const address = protocol + '//' + ws.contact.address.hostname +':'+ ws.contact.address.port + ws.contact.address.path;

        this._kademliaNode.rules.initializeWebSocket(address, ws.contact, ws)

    }


}