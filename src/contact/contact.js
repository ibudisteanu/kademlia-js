const Validation = require('./../helpers/validation')

module.exports = class Contact{

    constructor(protocol, hostname, port, identity){

        Validation.validateProtocol(protocol);
        Validation.validateHostname(hostname);
        Validation.validatePort(port);
        Validation.validateIdentity(identity);

        this.protocol = protocol;
        this.hostname = hostname;
        this.port = port;
        this.identity = identity;
        this.identityHex = identity.toString('hex')
    }

    clone(){
        return new Contact(this.protocol, this.hostname, this.port, Buffer.from( this.identityHex, 'hex') );
    }

}