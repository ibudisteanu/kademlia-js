const nacl = require('tweetnacl');
const bencode = require('bencode');
const Contact = require('../../contact/contact')

module.exports = function (kademliaRules) {

    const _send = kademliaRules.send.bind(kademliaRules);
    kademliaRules.send = send;

    const _sendReceivedSerialized = kademliaRules.sendReceivedSerialized.bind(kademliaRules);
    kademliaRules.sendReceivedSerialized = sendReceivedSerialized;

    const _receiveSerialized = kademliaRules.receiveSerialized.bind(kademliaRules);
    kademliaRules.receiveSerialized = receiveSerialized;

    if (kademliaRules._kademliaNode.plugins.hasPlugin('PluginNodeHttp')){
        kademliaRules._server.onReceive = receiveSerialized.bind(kademliaRules);
    }

    function send(destContact, command, data, cb){

        const buffer = bencode.encode([ command, data ]);

        const nonce = nacl.randomBytes(24);

        const box = nacl.box(
            buffer,
            nonce,
            destContact.publicKey,
            this._kademliaNode.contact.privateKey,
        )

        this.sendSerialized(destContact, command, bencode.encode( [ this._kademliaNode.contact.toArray(), nonce, Buffer.from(box) ] ), (err, buffer)=>{

            if (err) return cb(err);
            this.sendReceivedSerialized(destContact, nonce, command, buffer, cb);

        });

    }


    function sendReceivedSerialized(destContact, nonce, command, buffer, cb){

        try{

            const payload = nacl.box.open(
                buffer,
                nonce,
                destContact.publicKey,
                this._kademliaNode.contact.privateKey,
            )

            _sendReceivedSerialized(destContact, command, Buffer.from(payload) , cb );

        }catch(err){
            return cb(err);
        }


    }

    function receiveSerialized( srcContact, buffer, cb){

        const decoded = bencode.decode(buffer);
        if (!decoded) return cb( new Error('Error decoding data. Invalid bencode'));

        try{

            srcContact = Contact.fromArray( this._kademliaNode, decoded[0] )

            const payload = nacl.box.open(
                decoded[2],
                decoded[1],
                srcContact.publicKey,
                this._kademliaNode.contact.privateKey,
            )

            _receiveSerialized( srcContact,  Buffer.from(payload), ( err, buffer )=>{

                if (err) return cb(err);

                const box = nacl.box(
                    buffer,
                    decoded[1],
                    srcContact.publicKey,
                    this._kademliaNode.contact.privateKey,
                )

                cb(null, Buffer.from(box) );

            });

        }catch(err){

            cb(err);

        }

    }

}