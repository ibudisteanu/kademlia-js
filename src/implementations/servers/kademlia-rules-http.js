const KademliaRules = require('../../kademlia-rules')
const Contact = require('../../contact/contact')
const HTTPServer = require('./http-server')
const uuid = require('uuid').v1;
const bencode = require('bencode');

module.exports = class KademliaRulesHTTP extends KademliaRules {

    constructor(kademliaNode, store) {
        super(kademliaNode, store);

        this._server = new HTTPServer(kademliaNode, this.receive.bind(this) );

    }

    start(){
        this._server.start();
    }

    stop(){
        this._server.stop();
    }

    send(destContact, command, data, cb){

        const id = uuid();

        const buffer = bencode.encode([ this._kademliaNode.contact.toArray(), command, data])
        this._server.write( id, destContact, buffer, (err, out)=>{

            if (err) cb(err);

            const decoded = bencode.decode(out);
            if (command === 'PING' || command === 'STORE')
                console.log(command, decoded)

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

    receive( buffer, cb){

        const decoded = bencode.decode(buffer);
        if (!decoded)
            return cb(new Error("Decoded data is invalid"));

        if (decoded[0].length)
            decoded[0] = Contact.fromArray( decoded[0] )

        decoded[1] = decoded[1].toString()

        super.receive( decoded[0], decoded[1], decoded[2], (err, out)=>{

            if (err) return cb(err);

            if (Array.isArray(out))
                for (let i=0; i < out.length; i++)
                    if (out[i] instanceof Contact)
                        out[i] = out[i].toArray();

            const buffer = bencode.encode(out);
            cb(null, buffer);

        });

    }

    store(srcContact, [key, value], cb) {
        if (Buffer.isBuffer(value))
            value = value.toString();
        super.store(srcContact, [key, value], cb);
    }

    sendStore(contact, [key, value], cb){

        if ( Buffer.isBuffer(value) )
            value = value.toString();

        super.sendStore(contact, [key, value], cb);
    }

}