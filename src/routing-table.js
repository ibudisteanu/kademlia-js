const BufferUtils = require('./helpers/buffer-utils')
const KBucket = require('./kbucket')

module.exports = class RoutingTable {

    constructor(kademliaNode) {

        this._kademliaNode = kademliaNode;

        this.buckets = new Array(global.KAD_OPTIONS.BUCKETS_COUNT).fill( null );
        this.buckets = this.buckets.map( (it, index) =>  new KBucket(index) );
        this.map = {};
        this.count = 0;
    }

    start(){
        this._refreshBuckets();
    }

    stop(){
        clearTimeout(this._timeoutRefreshBucket);
    }

    addContact(contact){

        if (contact.identity.equals( this._kademliaNode.contact.identity) )
            return [false];

        if (this.map[contact.identityHex]) {  //already have it
            this._refreshContactItem(this.map[contact.identityHex]);
            return [false, this.map[contact.identityHex].bucketIndex, -1, true];
        }

        const bucketIndex = this.getBucketIndex( contact.identity );

        if (this.buckets[bucketIndex].length === global.KAD_OPTIONS.BUCKET_COUNT_K)
            return [false, bucketIndex, -1, false]; //I have already too many in the bucket

        const newContact = contact.clone();
        newContact.bucketIndex = bucketIndex;
        newContact.pingLastCheck = Date.now();
        newContact.pingResponded = null;
        this.buckets[bucketIndex].push( newContact );
        this.map[contact.identityHex] = newContact;
        this.count += 1;

        return [true, bucketIndex, this.buckets, this.buckets[bucketIndex].length-1 ];
    }


    removeContact(contact){

        if (typeof contact.bucketIndex !== 'number') throw "bucketIndex is not assigned";
        const bucketIndex = contact.bucketIndex;

        //new search, because the position could have been changed
        const index = this.buckets[contact.bucketIndex].findContactByIdentity(contact.identity);

        if (index !== -1) {
            this.buckets.splice(index, 1);
            delete this.map[contact.identityHex];
            this.count -= 1;
        }
    }


    _refreshBuckets(){

        const bucketIndex = Math.floor( Math.random() * this.buckets.length );

        if (this.buckets[bucketIndex].length > 0) {
            const contactIndex = this.buckets[bucketIndex].length-1;
            const contactItem = this.buckets[bucketIndex][contactIndex];

            //check availability
            this._kademliaNode.rules.sendPing(contactItem, (err, out)=>{

                if (!err && out === true){
                    contactItem.pingLastCheck = Date.now();
                    contactItem.pingResponded = true;
                    this._refreshContactItem(contactItem);
                } else{
                    //offline, let's remove it
                    contactItem.pingResponded = false;
                }

            });
        }

        this._timeoutRefreshBucket = setTimeout( this._refreshBuckets.bind(this), global.KAD_OPTIONS.T_BUCKET_REFRESH );
    }

    _refreshContactItem(contact){
        contact.pingLastCheck = Date.now();
        this._sortBucket(contact.bucketIndex);
    }

    _sortBucket(bucketIndex){
        this.buckets[ bucketIndex ].sort( (a,b) => a.pingLastCheck - b.pingLastCheck  );
    }

    getBucketIndex(foreignNodeKey){

        const distance = BufferUtils.xorDistance(this._kademliaNode.contact.identity, foreignNodeKey );
        let bucketIndex = global.KAD_OPTIONS.BUCKETS_COUNT;

        for (const byteValue of distance) {
            if (byteValue === 0) {
                bucketIndex -= 8;
                continue;
            }

            for (let i = 0; i < 8; i++) {
                if (byteValue & (0x80 >> i)) {
                    return --bucketIndex;
                } else {
                    bucketIndex--;
                }
            }
        }

        return bucketIndex;
    }



    getClosestToKey(key, count = global.KAD_OPTIONS.BUCKET_COUNT_K, bannedMap){

        const bucketIndex = this.getBucketIndex(key);
        const contactResults = [];

        const _addNearestFromBucket = bucket => {

            const entries = this.buckets[bucket].getBucketClosestToKey( key, count );
            for (let i = 0; i < entries.length; i++)
                if (contactResults.length === count ) break;
                else if ( bannedMap && bannedMap[entries[i].contact.identityHex] )  continue;
                else contactResults.push(entries[i]);

        }

        let ascIndex = bucketIndex+1;
        let descIndex = bucketIndex-1;

        _addNearestFromBucket(bucketIndex);

        while (contactResults.length < count && descIndex >= 0)
            _addNearestFromBucket(descIndex--);

        while (contactResults.length < count && ascIndex < global.KAD_OPTIONS.BUCKETS_COUNT)
            _addNearestFromBucket(ascIndex++);

        //TODO verifiy if contactResults always returned sorted by distance...
        //TODO: contactResults.sort( (a,b)=> BufferUtils.compareKeyBuffers(a.distance, b.distance) );
        return contactResults;

    }

}