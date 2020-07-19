const HTTPServer = require('./http-server')
const uuid = require('uuid').v1;
const ContactAddressProtocolType = require('../../contact/contact-address-protocol-type')

module.exports = function (kademliaRules) {

    kademliaRules._server = new HTTPServer( kademliaRules._kademliaNode, kademliaRules.receiveSerialized.bind( kademliaRules) );

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

    function sendSerialized(destContact, command, buffer, cb){

        const id = uuid();
        this._server.write( id, destContact, buffer, cb )

    }




}