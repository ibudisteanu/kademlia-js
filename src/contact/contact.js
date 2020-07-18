const Validation = require('./../helpers/validation')
const ContactAddress = require('./contact-address')
const StringUtils = require('./../helpers/string-utils')

module.exports = class Contact{

    constructor(identity, address ){

        Validation.validateIdentity(identity)

        this.identity = identity;
        this.identityHex = identity.toString('hex')

        this.address = address;
    }

    clone(){
        return new Contact( Buffer.from( this.identityHex, 'hex'), this.address.clone() );
    }

    //used for bencode
    toArray(){
        return [this.identity, ...this.address.toArray() ];
    }

    //used for bencode
    static fromArray(arr){
        return new Contact( arr[0], ContactAddress.fromArray( arr, 1 ) );
    }

    static createNewContact(address){
        const identity = Buffer.from( StringUtils.genHexString(global.KAD_OPTIONS.NODE_ID_LENGTH));
        return new Contact(identity, address);
    }

}