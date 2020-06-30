const BufferUtils = require('../helpers/buffer-utils')
const async = require('async')

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
        this._createIntervalRefresh();
        this._createIntervalReplicate();
    }

    _createIntervalRefresh(){
        this._intervalRefresh = setTimeout(
            () => this.refresh(0),
            global.KAD_OPTIONS.T_BUCKETS_REFRESH + this._preventConvoy(),
        );
    }

    _createIntervalReplicate(){
        delete this._iteratorReplicate;
        this._intervalReplicate = setTimeout(
            () => this._replicate(() => {} ),
            global.KAD_OPTIONS.T_BUCKETS_REPLICATE + this._preventConvoy(),
        );
    }

    stop(){
        clearInterval(this._intervalRefresh);
        clearInterval(this._intervalReplicate);
    }


    /**
     * If no node lookups have been performed in any given bucket's range for
     * T_REFRESH, the node selects a random number in that range and does a
     * refresh, an iterativeFindNode using that number as key.
     * @param {number} startIndex
     */
    refresh(startIndex = 0, callback = () => null) {
        const now = Date.now();

        async.each(  this._routingTable.buckets, (bucket, next) => {

            const bucketHasContacts = bucket.length > 0;
            const lastBucketLookup = this._routingTable.bucketsLookups[bucket.bucketIndex] || 0;
            const needsRefresh = lastBucketLookup + global.KAD_OPTIONS.T_BUCKETS_REFRESH <= now;

            if (bucketHasContacts && needsRefresh) {
                return this._kademliaNode.crawler.iterativeFindNode(
                    BufferUtils.getRandomBufferInBucketRange(this._kademliaNode.contact.identity, bucket.bucketIndex),
                    next,
                );
            }else
                next();

        }, (err, out ) => {
            callback(err, out);
            this._createIntervalRefresh();
        });
    }


    _replicate(cb){

        const now = Date.now();
        if ( !this._iteratorReplicate  )
            this._iteratorReplicate = this._store.iterator();

        let itValue = this._iteratorReplicate.next();
        while (!itValue.done){

            const key = itValue.value[0];
            const value = itValue.value[1];

            const isPublisher = this._publishedByMe[key];
            const republishDue = (value.timestamp + global.KAD_OPTIONS.T_BUCKETS_REPUBLISH) <= now;
            const replicateDue = (value.timestamp + global.KAD_OPTIONS.T_BUCKETS_REPLICATE) <= now;
            const shouldRepublish = isPublisher && republishDue;
            const shouldReplicate = !isPublisher && replicateDue;

            if (shouldReplicate || shouldRepublish) {
                this._kademliaNode.crawler.iterativeStoreValue(key, value, (err, out) => {
                    setTimeout(this._replicate.bind(this, cb), 1);
                });
                return;
            }

        }

        if (!itValue.done) {
            cb(null, true);
            this._createIntervalReplicate();
        }

    }

}