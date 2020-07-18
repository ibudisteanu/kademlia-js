const Validation = require('./../helpers/validation')
const ContactAddress = require('./contact-address')
const StringUtils = require('./../helpers/string-utils')


module.exports = class Contact{

    constructor(  kademliaNode, identity ){

        Validation.validateIdentity(identity)

        this._kademliaNode = kademliaNode;

        this.identity = identity;
        this.identityHex = identity.toString('hex')

        this.address = new ContactAddress( ...arguments );

        this._additionalParameters = 6;
        for (let i=0; i < kademliaNode.pluginsContact.length; i++)
            kademliaNode.pluginsContact[i].create.call(this, ...arguments);

    }

    clone(){
        return Contact.fromArray( this._kademliaNode, this.toArray() );
    }

    //used for bencode
    toArray(){
        return [this.identity, ...this.address.toArray() ];
    }

    //used for bencode
    static fromArray(kademliaNode, arr){

        arr.unshift(kademliaNode);
        arr[3] = arr[3].toString('ascii');
        arr[5] = arr[5].toString('ascii');

        return new Contact( ...arr );
    }


}