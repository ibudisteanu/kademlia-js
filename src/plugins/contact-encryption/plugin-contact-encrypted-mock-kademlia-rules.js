const nacl = require('tweetnacl');
const BufferHelper = require('../../helpers/buffer-utils')
const bencode = require('bencode');

module.exports = function (kademliaRules) {

    if (kademliaRules._kademliaNode.hasPlugin('PluginNodeMock')){

        const _send = kademliaRules.send.bind(kademliaRules);
        kademliaRules.send = send;

        const _receive = kademliaRules.receive.bind(kademliaRules);
        kademliaRules.receive = receive;

        function send(destContact, command, data, cb){

            const buffer = bencode.encode( BufferHelper.serializeData([ this._kademliaNode.contact, command, data ] ) )
            const nonce = nacl.randomBytes(24);

            const box = nacl.box(
                buffer,
                nonce,
                destContact.publicKey,
                this._kademliaNode.contact.privateKey,
            )

            _send(destContact, command, [ nonce, box ], cb);
        }

        function receive( buffer, cb){

            const decoded = this.decodeReceiveAnswer(buffer);
            if (!decoded) cb( new Error('Error decoding data. Invalid bencode'));

            const payload = nacl.box.open(
                decoded[2][1],
                decoded[2][0],
                decoded[0].publicKey,
                this._kademliaNode.contact.privateKey,
            )

            _receive(  payload, cb);

        }

    }

}