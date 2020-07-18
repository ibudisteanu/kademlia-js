const nacl = require('tweetnacl');
const BufferHelper = require('../../helpers/buffer-utils')
const bencode = require('bencode');

module.exports = function (kademliaRules) {

    if (kademliaRules._kademliaNode.hasPlugin('PluginNodeMock')){

        const _send = kademliaRules.send.bind(kademliaRules);
        const _receive = kademliaRules.receive.bind(kademliaRules);

        kademliaRules.send = send;
        kademliaRules.receive = receive;

        function send(destContact, command, data, cb){

            const buffer = bencode.encode( BufferHelper.serializeData([ command, ...data ] ) )
            const nonce = nacl.randomBytes(24);

            const box = nacl.box(
                buffer,
                nonce,
                destContact.publicKey,
                this._kademliaNode.contact.privateKey,
            )

            _send(destContact, undefined, [ nonce, box ], cb);
        }

        function receive( srcContact, command, [nonce, box], cb) {

            const payload = nacl.box.open(
                box,
                nonce,
                srcContact.publicKey,
                this._kademliaNode.contact.privateKey,
            )

            const decoded = bencode.decode(payload);

            _receive(srcContact, decoded[0].toString('ascii'), decoded.slice(1), cb);

        }

    }

}