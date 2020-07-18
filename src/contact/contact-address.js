const Validation = require('./../helpers/validation')

module.exports = class ContactAddress {

    constructor( protocol, hostname, port, path) {

        Validation.validateProtocol(protocol);
        Validation.validateHostname(hostname);
        Validation.validatePort(port);
        Validation.validatePath(path);

        this.protocol = protocol;
        this.hostname = hostname;
        this.port = port;
        this.path = path;
    }

    clone(){
        return new ContactAddress( this.protocol, this.hostname, this.port, this.path );
    }

    toArray(){
        return [  this.protocol, Buffer.from(this.hostname, "ascii"), this.port, Buffer.from(this.path, "ascii") ];
    }

    static fromArray(arr, offset ){
        return new ContactAddress( arr[offset], arr[offset+1].toString(), arr[offset+2], arr[offset+3].toString() );
    }

}