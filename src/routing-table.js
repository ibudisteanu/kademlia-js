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

        if (this.map[contact.identityHex]) {  //already have it
            this._refreshContact(contact);
            return false;
        }

        const bucketIndex = this.getBucketIndex( contact.identity );
        if (bucketIndex === 0) return false; //they are both the same

        if (this.buckets[bucketIndex].length === global.KAD_OPTIONS.BUCKET_COUNT_K)
            return false; //I have already too many in the bucket

        this.buckets[bucketIndex].push({
            contact,
            bucketIndex,
            availability: 1, //already available
            latCheck: new Date().getTime(),
        });
        this.map[contact.identityHex] = contact;
        this.count += 1;

        return true;
    }

    retrieve(){

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
            const contactIndex = Math.floor(Math.random() * this.buckets[bucketIndex].length);
            const contact = this.buckets[bucketIndex][contactIndex];

            //check availability
            let online = true;
            if (online) { //online
                this._refreshContact(contact);
            } else { //offline, let's remove it
                contact.availability = 0;
                this.remove(contact);
            }
        }

        this._timeoutRefreshBucket = setTimeout( this._refreshBuckets.bind(this), global.KAD_OPTIONS.T_BUCKET_REFRESH );
    }

    _refreshContact(contact){
        contact.availability += new Date().getTime() - contact.lastCheck;
        contact.lastCheck = new Date().getTime();
        this._sortBucket(contact.bucketIndex);
    }

    _sortBucket(bucketIndex){
        this.buckets[ this.map[ bucketIndex ] ].sort( (a,b) => a-b  );
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



    getClosestToKey(key, count = global.KAD_OPTIONS.BUCKET_COUNT_K){

        const bucketIndex = this.getBucketIndex(key);
        const contactResults = [];

        const _addNearestFromBucket = bucket => {

            const entries = this.buckets[bucket].getBucketClosestToKey( key, count );
            entries.splice(0, count - contactResults.length)
                .forEach( contact => {
                    if (contactResults.length < count)
                        contactResults.push(contact);
                });
        }

        let ascIndex = bucketIndex+1;
        let descIndex = bucketIndex-1;

        _addNearestFromBucket(bucketIndex);

        while (contactResults.length < count && descIndex >= 0)
            _addNearestFromBucket(descIndex--);

        while (contactResults.length < count && ascIndex < global.KAD_OPTIONS.BUCKETS_COUNT)
            _addNearestFromBucket(ascIndex++);

        return contactResults;

    }

}