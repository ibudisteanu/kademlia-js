const WebSocket = require('isomorphic-ws')
const ContactAddressProtocolType= require('../../contact/contact-address-protocol-type')
const Contact = require('../../contact/contact')
const bencode = require('bencode');

module.exports = class WebSocketServer extends WebSocket.Server {

    constructor(kademliaNode, options) {
        super(options);
        this._kademliaNode = kademliaNode;

        this.on('connection', this.newClientConnection );
        this.on('disconnect', this.clientDisconnect)

    }

    newClientConnection(ws){

        try{
            const decoded = bencode.decode( Buffer.from( ws.protocol, "base64") );
            const contact = Contact.fromArray(this._kademliaNode, decoded);
            ws._kadInitialized = true;
            ws.contact = contact;
            ws.send( bencode.encode( this._kademliaNode.contact.toArray() ) );
        }catch(err){
            return ws.close();
        }

        this._kademliaNode.rules.webSocketActiveConnections.push(ws);

        const protocol = ( ws.contact.address.protocol === ContactAddressProtocolType.CONTACT_ADDRESS_PROTOCOL_TYPE_SECURED_WEBSOCKET) ? 'wss' : 'ws';
        const address = protocol + '//' + ws.contact.address.hostname +':'+ ws.contact.address.port + ws.contact.address.path;

        this._kademliaNode.rules.webSocketActiveConnectionsMap[address] = ws;

        ws.on('message', (buffer) => {

            this._kademliaNode.rules.receiveSerialized( undefined, ws.contact, buffer, (err, buffer )=>{

                if (err)
                    return ;

                ws.send(buffer);

            });

        });



    }

    clientDisconnect(ws){

        this._kademliaNode.rules.webSocketActiveConnections.push(ws);

    }

}