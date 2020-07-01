const BufferUtils = require('../helpers/buffer-utils')
const async = require('async')
const NextTick = require('./../helpers/next-tick')

module.exports = class RoutingTableRefresher {

    constructor(kademliaNode, routingTable) {
        this._kademliaNode = kademliaNode;
        this._routingTable = routingTable;

        this._publishedByMe = {};

    }

    publishedByMe(key){
        this._publishedByMe[key] = true;
    }

    _preventConvoy( timeout = 30 * 60 * 1000) {
        return Math.ceil( Math.random() * timeout );
    }

    start(){
        this._createTimeoutRefresh();
        this._createTimeoutReplicate();
    }

    _createTimeoutRefresh(){
        if (this._timeoutRefresh) clearTimeout(this._timeoutRefresh)
        this._timeoutRefresh = setTimeout(
            () => this.refresh(0, () => {} ),
            global.KAD_OPTIONS.T_BUCKETS_REFRESH + this._preventConvoy(),
        );
    }

    _createTimeoutReplicate(){
        if (this._timeoutReplicate) clearTimeout(this._timeoutReplicate);
        delete this._iteratorReplicate; 
        this._timeoutReplicate = setTimeout(
            () => this._replicate(() => {} ),
            global.KAD_OPTIONS.T_BUCKETS_REPLICATE + this._preventConvoy(),
        );
    }

    stop(){
        clearTimeout(this._timeoutRefresh);
        clearTimeout(this._timeoutReplicate);
    }


    /**
     * If no node lookups have been performed in any given bucket's range for
     * T_REFRESH, the node selects a random number in that range and does a
     * refresh, an iterativeFindNode using that number as key.
     * @param {number} startIndex
     */
    refresh(startIndex = 0, callback) {
        const now = Date.now();

        /**
         *  We want to avoid high churn during refresh and prevent further
         *  refreshes if lookups in the next bucket do not return any new
         *  contacts. To do this we will shuffle the bucket indexes we are
         *  going to check and only continue to refresh if new contacts were
         *  discovered in the last MAX_UNIMPROVED_REFRESHES consecutive lookups.
         * @type {Set<any>}
         */

        let results = new Set(), consecutiveUnimprovedLookups = 0, finished = false;
        async.each(  this._routingTable.buckets, (bucket, next) => {

            if (finished) return next();

            if (consecutiveUnimprovedLookups >= global.KAD_OPTIONS.MAX_UNIMPROVED_REFRESHES){
                finished = true;
                return next();
            }

            const lastBucketLookup = this._routingTable.bucketsLookups[bucket.bucketIndex] || 0;
            const needsRefresh = lastBucketLookup + global.KAD_OPTIONS.T_BUCKETS_REFRESH <= now;

            if (bucket.length > 0 && needsRefresh)
                return this._kademliaNode.crawler.iterativeFindNode(
                    BufferUtils.getRandomBufferInBucketRange(this._kademliaNode.contact.identity, bucket.bucketIndex),
                    (err, contacts )=>{
                        if (err) return next(err);
                        let discoveredNewContacts = false;

                        for (let contact of contacts)
                            if (!results.has(contact.identityHex)) {
                                discoveredNewContacts = true;
                                consecutiveUnimprovedLookups = 0;
                                results.add(contact.identityHex);
                            }

                        if (!discoveredNewContacts)
                            consecutiveUnimprovedLookups++;

                        next();
                    },
                );

            next();

        }, (err, out ) => {
            this._createTimeoutRefresh();
            callback(err, out);
        });
    }


    _replicate(cb){

        const now = Date.now();
        if ( !this._iteratorReplicate  )
            this._iteratorReplicate = this._kademliaNode._store.iterator();

        let itValue = this._iteratorReplicate.next();
        while (itValue.value && !itValue.done){

            const key = itValue.value[0];
            const value = itValue.value[1];

            const isPublisher = this._publishedByMe[key];
            const republishDue = (value.timestamp + global.KAD_OPTIONS.T_BUCKETS_REPUBLISH) <= now;
            const replicateDue = (value.timestamp + global.KAD_OPTIONS.T_BUCKETS_REPLICATE) <= now;
            const shouldRepublish = isPublisher && republishDue;
            const shouldReplicate = !isPublisher && replicateDue;

            if (shouldReplicate || shouldRepublish) 
                return this._kademliaNode.crawler.iterativeStoreValue(key, value, (err, out) => {
                    NextTick(this._replicate.bind(this, cb), 1);
                });

        }

        if (!itValue.value || !itValue.done) {
            cb(null, true);
            this._createTimeoutReplicate();
        }

    }

}