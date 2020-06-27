const Validation = require('./../helpers/validation')

module.exports = class Contact{

    constructor(ip, port, identity){

        Validation.validateIp(ip);
        Validation.validatePort(port);
        Validation.validateIdentity(identity);

        this.ip = ip;
        this.port = port;
        this.identity = identity;
        this.identityHex = identity.toString('hex')
    }

    clone(){
        return new Contact(this.ip, this.port, Buffer.from( this.identityHex, 'hex') );
    }

}