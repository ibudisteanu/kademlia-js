const Validation = require('./../helpers/validation')

module.exports = class Contact{

    constructor(hostname, port, identity){

        Validation.validateHostname(hostname);
        Validation.validatePort(port);
        Validation.validateIdentity(identity);

        this.hostname = hostname;
        this.port = port;
        this.identity = identity;
        this.identityHex = identity.toString('hex')
    }

    clone(){
        return new Contact(this.hostname, this.port, Buffer.from( this.identityHex, 'hex') );
    }

}