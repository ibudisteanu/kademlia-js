const eccrypto = require("eccrypto");

module.exports =  {

    createPrivateKey(){
        return eccrypto.generatePrivate();
    },

    getPublicKey(privateKey){
        return Buffer.from( eccrypto.getPublic(privateKey) );
    },

    encrypt(publicKey, message, cb){
        eccrypto.encrypt(publicKey, message)
            .then( out => cb(null, out) )
            .catch( err => cb(err ) )
    },

    decrypt(privateKey, message, cb){
        eccrypto.decrypt( privateKey, message, )
            .then( out => cb(null, out) )
            .catch( err => cb(err ) )
    },

}