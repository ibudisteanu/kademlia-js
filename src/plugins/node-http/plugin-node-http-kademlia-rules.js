const Contact = require('../../contact/contact')
const HTTPServer = require('./http-server')
const uuid = require('uuid').v1;
const bencode = require('bencode');
const BufferHelper = require('../../helpers/buffer-utils')

module.exports = function (kademliaRules) {

    kademliaRules._server = new HTTPServer( kademliaRules._kademliaNode, kademliaRules.receiveSerialized.bind( kademliaRules) );

    const _start = kademliaRules.start.bind(kademliaRules);
    kademliaRules.start = start;

    const _stop = kademliaRules.stop.bind(kademliaRules);
    kademliaRules.stop = stop;

    kademliaRules.sendSerialized = sendSerialized;

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