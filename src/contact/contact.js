const Validation = require('./../helpers/validation')
const ContactAddress = require('./contact-address')
const StringUtils = require('./../helpers/string-utils')


module.exports = class Contact{

    constructor(  kademliaNode, version, identity ){

        Validation.validateIdentity(identity)

        this._kademliaNode = kademliaNode;

        this.version = version;

        this.identity = identity;
        this.identityHex = identity.toString('hex')

        this.address = new ContactAddress( ...arguments );

        this._additionalParameters = 7;
        for (let i=0; i < kademliaNode.plugins.contactPlugins.length; i++)
            kademliaNode.plugins.contactPlugins[i].create.call(this, ...arguments);

    }

    clone(){
        return Contact.fromArray( this._kademliaNode, this.toArray() );
    }

    //used for bencode
    toArray(){
        return [ this.version, this.identity, ...this.address.toArray() ];
    }

    //used for bencode
    static fromArray(kademliaNode, arr){

        arr.unshift(kademliaNode);
        arr[4] = arr[4].toString('ascii');
        arr[6] = arr[6].toString('ascii');

        return new Contact( ...arr );
    }

    toJSON(){
        return {
            version: this.version,
            identity: this.identityHex,
            address:this.address.toJSON(),
        }
    }

}
