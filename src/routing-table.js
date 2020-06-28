const BufferUtils = require('./helpers/buffer-utils')
const KBucket = require('./kbucket')
const async = require('async')

module.exports = class RoutingTable {

    constructor(kademliaNode) {

        this._kademliaNode = kademliaNode;

        this.buckets = new Array(global.KAD_OPTIONS.BUCKETS_COUNT_B).fill( null );
        this.buckets = this.buckets.map( (it, index) =>  new KBucket(index) );
        this.map = {};

        this.bucketsLookups = {}; // Track the last lookup time for buckets
        this.count = 0;
    }

    start(){
        this._intervalRefresh = setInterval( this.refresh.bind(this, 0), global.KAD_OPTIONS.T_BUCKETS_REFRESH);
    }

    stop(){
        clearInterval(this._intervalRefresh);
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


    _refreshContactItem(contact){
        contact.pingLastCheck = Date.now();
        this._sortBucket(contact.bucketIndex);
    }

    _sortBucket(bucketIndex){
        this.buckets[ bucketIndex ].sort( (a,b) => a.pingLastCheck - b.pingLastCheck  );
    }

    getBucketIndex(foreignNodeKey){

        const distance = BufferUtils.xorDistance(this._kademliaNode.contact.identity, foreignNodeKey );
        let bucketIndex = global.KAD_OPTIONS.BUCKETS_COUNT_B;

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

            for (let i = 0; i < entries.length && contactResults.length < count; i++)
                if ( !bannedMap || !bannedMap[entries[i].contact.identityHex] )
                    contactResults.push(entries[i]);

        }

        let ascIndex = bucketIndex+1;
        let descIndex = bucketIndex-1;

        _addNearestFromBucket(bucketIndex);

        while (contactResults.length < count && descIndex >= 0)
            _addNearestFromBucket(descIndex--);

        while (contactResults.length < count && ascIndex < global.KAD_OPTIONS.BUCKETS_COUNT_B)
            _addNearestFromBucket(ascIndex++);

        return contactResults;

    }

    /**
     * If no node lookups have been performed in any given bucket's range for
     * T_REFRESH, the node selects a random number in that range and does a
     * refresh, an iterativeFindNode using that number as key.
     * @param {number} startIndex
     */
    refresh(startIndex = 0, callback = () => null) {
        const now = Date.now();

        async.each(  this.buckets, (bucket, next) => {

            const bucketHasContacts = bucket.length > 0;
            const lastBucketLookup = this.bucketsLookups[bucket.bucketIndex] || 0;
            const needsRefresh = lastBucketLookup + global.KAD_OPTIONS.T_BUCKETS_REFRESH <= now;

            if (bucketHasContacts && needsRefresh) {
                return this._kademliaNode.crawler.iterativeFindNode(
                    BufferUtils.getRandomBufferInBucketRange(this._kademliaNode.contact.identity, bucket.bucketIndex),
                    next,
                );
            }else
                next();

        }, callback);
    }

    /**
     * Returns the [index, bucket] of the occupied bucket with the lowest index
     * @returns {array}
     */
    getClosestBucket() {

        for (let i=0; i < this.buckets.length-1; i++ )
            if ( this.buckets[i].length !== 0)
                return this.buckets[i];

    }

    /**
     * Returns an array of all occupied buckets further than the closest
     * @returns {array}
     */
    getBucketsBeyondClosest() {
        const furtherBuckets = [];
        const closestBucket = this.getClosestBucket();

        for (let i = closestBucket.bucketIndex + 1; i < this.buckets.length; i++)
            if (this.buckets[i].length !== 0)
                furtherBuckets.push( this.buckets[i] );

        return furtherBuckets;
    }

}