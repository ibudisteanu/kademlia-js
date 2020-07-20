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

    if (kademliaRules._kademliaNode.plugins.hasPlugin('PluginNodeHTTP')){
        kademliaRules._server.onReceive = receiveSerialized.bind(kademliaRules);
    }

    function send(destContact, command, data, cb){

        const sendSerializedFct = this._sendSerializedByProtocol[destContact.address.protocol];
        const {sendSerialized, id, buffer} = sendSerializedFct(destContact, command, data);

        ECCUtils.encrypt(destContact.publicKey, buffer, (err, out)=>{

            if (err) return cb(err);

            sendSerialized(id, destContact, command, bencode.encode( out ), (err, buffer)=>{

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

    function receiveSerialized( id, srcContact, buffer, cb){

        const decoded = bencode.decode(buffer);
        if (!decoded) return cb( new Error('Error decoding data. Invalid bencode'));

        ECCUtils.decrypt(this._kademliaNode.contact.privateKey, decoded, (err, payload)=>{

            if (err) return cb(err);

            const decoded = this.decodeReceiveAnswer( id, srcContact, payload );
            if (!decoded) cb( new Error('Error decoding data. Invalid bencode'));

            let c = 0;
            if (id === undefined) id = decoded[c++];
            if (srcContact === undefined) srcContact = decoded[c++];

            this.receive( id, srcContact, decoded[c++], decoded[c++], (err, out )=>{

                if (err) return cb(err);

                const buffer = bencode.encode( BufferHelper.serializeData(out) );
                ECCUtils.encrypt( srcContact.publicKey, buffer, (err, out)=>{

                    if (err) return cb(err);
                    cb(null, bencode.encode( out ));

                });

            });


        })

    }


}