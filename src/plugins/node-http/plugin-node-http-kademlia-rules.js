const Contact = require('../../contact/contact')
const HTTPServer = require('./http-server')
const uuid = require('uuid').v1;
const bencode = require('bencode');

module.exports = function PluginNodeHTTPKademliaRules(kademliaRules) {

    kademliaRules._server = new HTTPServer( kademliaRules._kademliaNode, receive.bind( kademliaRules) );

    const _start = kademliaRules.start.bind(kademliaRules);
    kademliaRules.start = start;

    const _stop = kademliaRules.stop.bind(kademliaRules);
    kademliaRules.stop = stop;

    const _send = kademliaRules.send.bind(kademliaRules);
    kademliaRules.send = send;

    const _receive = kademliaRules.receive.bind(kademliaRules);
    kademliaRules.receive = receive;

    const _store = kademliaRules.store.bind(kademliaRules);
    kademliaRules.store = store;

    const _sendStore = kademliaRules.sendStore.bind(kademliaRules);
    kademliaRules.sendStore = sendStore;

    kademliaRules._commands.STORE = store.bind(kademliaRules)

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

        const buffer = bencode.encode([ this._kademliaNode.contact.toArray(), command, data])
        this._server.write( id, destContact, buffer, (err, out)=>{

            if (err) cb(err);

            const decoded = bencode.decode(out);

            if (command === 'FIND_VALUE')
                if ( Buffer.isBuffer(decoded) )
                    return cb(null, decoded.toString() )

            if (command === 'FIND_VALUE' || command === 'FIND_NODE' ){
                const array = [];
                for (let i=0; i < decoded.length; i++)
                    array[i] = Contact.fromArray(decoded[i]);
                return cb(null, array );
            }

            cb(null, decoded);
        } )

    }

    function receive( buffer, cb){

        const decoded = bencode.decode(buffer);
        if (!decoded)
            return cb(new Error("Decoded data is invalid"));

        if (decoded[0].length)
            decoded[0] = Contact.fromArray( decoded[0] )

        decoded[1] = decoded[1].toString()

        _receive( decoded[0], decoded[1], decoded[2], (err, out)=>{

            if (err) return cb(err);

            if (Array.isArray(out))
                for (let i=0; i < out.length; i++)
                    if (out[i] instanceof Contact)
                        out[i] = out[i].toArray();

            const buffer = bencode.encode(out);
            cb(null, buffer);

        });

    }

    function store(srcContact, [key, value], cb) {
        if (Buffer.isBuffer(value))
            value = value.toString();

        return _store(srcContact, [key, value], cb);
    }

    function sendStore(srcContact, [key, value], cb){

        if ( Buffer.isBuffer(value) )
            value = value.toString();

        return _sendStore(srcContact, [key, value], cb);
    }

}