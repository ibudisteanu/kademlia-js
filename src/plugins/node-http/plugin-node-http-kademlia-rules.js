const Contact = require('../../contact/contact')
const HTTPServer = require('./http-server')
const uuid = require('uuid').v1;
const bencode = require('bencode');
const BufferHelper = require('../../helpers/buffer-utils')

module.exports = function (kademliaRules) {

    kademliaRules._server = new HTTPServer( kademliaRules._kademliaNode, receive.bind( kademliaRules) );

    const _start = kademliaRules.start.bind(kademliaRules);
    kademliaRules.start = start;

    const _stop = kademliaRules.stop.bind(kademliaRules);
    kademliaRules.stop = stop;

    const _send = kademliaRules.send.bind(kademliaRules);
    kademliaRules.send = send;

    const _receive = kademliaRules.receive.bind(kademliaRules);
    kademliaRules.receive = receive;


    function start(){
        _start(...arguments);
        this._server.start();
    }

    function stop(){
        _stop(...arguments);
        this._server.stop();
    }



    function send(destContact, command, data, cb){

        const id = uuid();

        const buffer = bencode.encode( BufferHelper.serializeData([ this._kademliaNode.contact, command, data ]) )
        this._server.write( id, destContact, buffer, (err, out)=>{

            if (err) return cb(err);

            const decoded = this.decodeSendAnswer(destContact, command, out);
            if (!decoded) return cb(new Error('Error decoding data'));

            cb(null, decoded);
        } )

    }

    function receive( buffer, cb){

        const decoded = this.decodeReceiveAnswer(buffer);
        if (!decoded) cb( new Error('Error decoding data. Invalid bencode'));

        _receive( decoded[0], decoded[1], decoded[2], (err, out)=>{

            if (err) return cb(err);

            const buffer = bencode.encode( BufferHelper.serializeData(out) );
            cb(null, buffer);

        });

    }


}