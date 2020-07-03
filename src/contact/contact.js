const Validation = require('./../helpers/validation')

module.exports = class Contact{

    constructor(protocol, hostname, port, path, identity){

        Validation.validateProtocol(protocol);
        Validation.validateHostname(hostname);
        Validation.validatePort(port);
        Validation.validateIdentity(identity);

        this.protocol = protocol;
        this.hostname = hostname;
        this.port = port;
        this.path = '';
        this.identity = identity;
        this.identityHex = identity.toString('hex')
    }

    clone(){
        return new Contact(this.protocol, this.hostname, this.port, this.path, Buffer.from( this.identityHex, 'hex') );
    }

    toJSON(){
        return {
            protocol: this.protocol,
            hostname: this.hostname,
            port: this.port,
            path: this.path,
            identity: this.identity,
        }
    }
}