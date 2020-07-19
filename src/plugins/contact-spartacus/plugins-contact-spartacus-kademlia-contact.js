const bencode = require('bencode');
const ECCUtils = require('../../helpers/ecc-utils')
const crypto = require('crypto');

module.exports = function(kademliaNode) {

    if (!kademliaNode.plugins.hasPlugin('PluginContactEncrypted'))
        throw "PluginContactEncrypted is required";

    kademliaNode.plugins.contactPlugins.push({
        create,
    })

    function create(  ){

        const nonce = arguments[this._additionalParameters++];
        if (!Buffer.isBuffer(nonce) || nonce.length !== 64) throw "Invalid Contact Public Key";
        this.nonce = nonce;

        const signature = arguments[this._additionalParameters++];
        if (!Buffer.isBuffer(signature) || signature.length !== 64) throw "Invalid Contact Public Key";
        this.signature = signature;

        const _toArray = this.toArray.bind(this);
        this.toArray = toArray;

        const _toJSON = this.toJSON.bind(this);
        this.toJSON = toJSON;

        this.sign = sign;
        this.verifySignature = verifySignature;

        const skipVerifySignature = arguments[this._additionalParameters++];
        if (!skipVerifySignature && !this.verifySignature())
            throw "Invalid Contact Spartacus Signature";

        //used for bencode
        function toArray(notIncludeSignature){

            const out = _toArray(...arguments);
            out.push(this.nonce);

            if (!notIncludeSignature)
                out.push(this.signature);

            return out;
        }

        function toJSON(){
            return {
                ..._toJSON(),
                nonce: this.nonce,
                signature: this.signature,
            }
        }

        //sign signature
        function sign(){
            const buffer = bencode.encode( this.toArray(true) );
            const msg = crypto.createHash("sha256").update(buffer).digest();
            return ECCUtils.sign(this.privateKey, msg);
        }

        //verify signature
        function verifySignature(){
            const buffer = bencode.encode( this.toArray(true) );
            const msg = crypto.createHash("sha256").update(buffer).digest();
            return ECCUtils.verifySignature(this.publicKey, msg, this.signature );
        }

    }

}