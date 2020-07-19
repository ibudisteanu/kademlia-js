const bencode = require('bencode');
const Contact = require('../../contact/contact')
const ECCUtils = require('../../helpers/ecc-utils')
const BufferHelper = require('../../helpers/buffer-utils')

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

        const buffer = bencode.encode([ this._kademliaNode.contact.toArray(), command, data ]);
        ECCUtils.encrypt(destContact.publicKey, buffer, (err, out)=>{

            if (err) return cb(err);

            const sendSerialized = this._sendSerializedByProtocol[destContact.address.protocol];
            if (!sendSerialized) return cb(new Error('unknown protocol'));

            sendSerialized(destContact, command, bencode.encode( out ), (err, buffer)=>{

                if (err) return cb(err);
                this.sendReceivedSerialized(destContact, command, buffer, cb);

            });

        })

    }


    function sendReceivedSerialized(destContact, command, buffer, cb){

        const decoded = bencode.decode(buffer);
        if (!decoded) return cb( new Error('Error decoding data. Invalid bencode'));

        ECCUtils.decrypt(this._kademliaNode.contact.privateKey, decoded, (err, payload)=>{

            if (err) return cb(err);

            _sendReceivedSerialized(destContact, command, payload , cb );

        });

    }

    function receiveSerialized( buffer, cb){

        const decoded = bencode.decode(buffer);
        if (!decoded) return cb( new Error('Error decoding data. Invalid bencode'));

        ECCUtils.decrypt(this._kademliaNode.contact.privateKey, decoded, (err, payload)=>{

            if (err) return cb(err);

            const decoded = this.decodeReceiveAnswer( payload );
            if (!decoded) cb( new Error('Error decoding data. Invalid bencode'));

            this.receive( decoded[0], decoded[1], decoded[2], (err, out)=>{

                if (err) return cb(err);

                const buffer = bencode.encode( BufferHelper.serializeData(out) );
                ECCUtils.encrypt( decoded[0].publicKey, buffer, (err, out)=>{

                    if (err) return cb(err);
                    cb(null, bencode.encode( out ));

                });

            });


        })

    }


}