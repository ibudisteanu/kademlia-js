
module.exports = function(kademliaNode) {

    kademliaNode.plugins.contactPlugins.push({
        create,
    })

    function create(  ){

        const publicKey = arguments[this._additionalParameters++];
        if (!Buffer.isBuffer(publicKey) || publicKey.length !== 32) throw "Invalid Contact Public Key";
        this.publicKey = publicKey;

        const _toArray = this.toArray.bind(this);
        this.toArray = toArray;

        //used for bencode
        function toArray(){
            return [ ..._toArray(), this.publicKey ];
        }

    }

}