const HTTPServer = require('./http-server')
const uuid = require('uuid').v1;
const ContactAddressProtocolType = require('../../contact/contact-address-protocol-type')
const bencode = require('bencode');
const BufferHelper = require('../../helpers/buffer-utils')

module.exports = function (kademliaRules) {

    kademliaRules._server = new HTTPServer( kademliaRules._kademliaNode );

    const _start = kademliaRules.start.bind(kademliaRules);
    kademliaRules.start = start;

    const _stop = kademliaRules.stop.bind(kademliaRules);
    kademliaRules.stop = stop;

    if (ContactAddressProtocolType.CONTACT_ADDRESS_PROTOCOL_TYPE_HTTP === undefined) throw new Error('HTTP protocol was not initialized.');
    kademliaRules._sendSerializedByProtocol[ContactAddressProtocolType.CONTACT_ADDRESS_PROTOCOL_TYPE_HTTP] = sendSerialized.bind(kademliaRules);
    kademliaRules._sendSerializedByProtocol[ContactAddressProtocolType.CONTACT_ADDRESS_PROTOCOL_TYPE_HTTPS] = sendSerialized.bind(kademliaRules);

    function start(){
        _start(...arguments);
        this._server.start();
    }

    function stop(){
        _stop(...arguments);
        this._server.stop();
    }

    function sendSerialized(destContact, command, data){
        const id = Math.floor( Math.random() * Number.MAX_SAFE_INTEGER );
        return {
            id,
            buffer: bencode.encode( BufferHelper.serializeData([ this._kademliaNode.contact, command, data ]) ),
            sendSerialized: (id, destContact, command, buffer, cb) => {
                this._server.write( id, destContact, buffer, cb )
            },
        }
    }

}