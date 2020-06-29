const KBucket = require('./kbucket')
const BufferUtils = require('./helpers/buffer-utils')

module.exports = class KBucket extends Array {

    constructor( bucketIndex) {
        super();
        this.bucketIndex = bucketIndex;
    }

    get tail(){
        return this[this.length-1];
    }

    get head(){
        return this[0];
    }

    getBucketClosestToKey( key, count =  global.KAD_OPTIONS.BUCKET_COUNT_K ){

        const contacts = [];

        for (let i=0; i < this.length; i++ )
            contacts.push({
                contact: this[i],
                distance: BufferUtils.xorDistance(this[i].identity, key )
            })

        return contacts.sort((a,b)=> BufferUtils.compareKeyBuffers(a.distance, b.distance) )
            .filter( a => !a.contact.identity.equals(key) )
            .splice(0, count)

    }

    findContactByIdentity(identity){

        for (let i=0; i < this.length; i++)
            if (this[i].identity.equals(identity) )
                return i

        return -1;
    }

}