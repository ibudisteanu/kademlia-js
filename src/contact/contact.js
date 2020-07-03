const Validation = require('./../helpers/validation')

module.exports = class Contact{

    constructor(identity, protocol, hostname, port, path){

        Validation.validateIdentity(identity);

        Validation.validateProtocol(protocol);
        Validation.validateHostname(hostname);
        Validation.validatePort(port);

        this.identity = identity;
        this.identityHex = identity.toString('hex')
        this.protocol = protocol;
        this.hostname = hostname;
        this.port = port;
        this.path = path;

    }

    clone(){
        return new Contact(this.protocol, this.hostname, this.port, this.path, Buffer.from( this.identityHex, 'hex') );
    }

    //used for bencode
    toArray(){
        return [this.identity, Buffer.from(this.protocol, "ascii"), Buffer.from(this.hostname, "ascii"), this.port, Buffer.from(this.path, "ascii")];
    }

    //used for bencode
    static fromArray(arr){
        return new Contact( arr[0], arr[1].toString(), arr[2].toString(), arr[3], arr[4].toString() );
    }
}