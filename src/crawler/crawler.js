const async = require('async');
const Validation = require('../helpers/validation')
const BufferUtils = require('../helpers/buffer-utils')

const CrawlerWorker = require('./crawler-worker')

module.exports = class Crawler {

    constructor(kademliaNode) {
        this._kademliaNode = kademliaNode;
    }

    /**
     * The search begins by selecting alpha contacts from the non-empty k-bucket closest
     * to the bucket appropriate to the key being searched on. If there are fewer than
     * alpha contacts in that bucket, contacts are selected from other buckets.
     * The contact closest to the target key, closestNode, is noted.
     *
     * The first alpha contacts selected are used to create a shortlist for the search.
     *
     * The node then sends parallel, asynchronous FIND_NODE RPCs to the alpha contacts in the shortlist.
     * Each contact, if it is live, should normally return k triples. If any of the alpha contacts
     * fails to reply, it is removed from the shortlist, at least temporarily.
     *
     * The node then fills the shortlist with contacts from the replies received. These are those
     * closest to the target. From the shortlist it selects another alpha contacts. The only
     * condition for this selection is that they have not already been contacted. Once again a FIND_NODE RPC
     * is sent to each in parallel.
     *
     * Each such parallel search updates closestNode, the closest node seen so far.
     *
     * The sequence of parallel searches is continued until either no node in the sets returned
     * is closer than the closest node already seen or the initiating node has accumulated k probed
     * and known to be active contacts.
     *
     * If a cycle doesn't find a closer node, if closestNode is unchanged, then the initiating node
     * sends a FIND_NOCE RPC to each of the k closest nodes that it has not already queried.
     *
     * At the end of this process, the node will have accumulated a set of k active contacts or
     * (if the RPC was FIND_VALUE) may have found a data value. Either a set of triples or the value
     * is returned to the caller.
     *
     * @param key
     * @param cb
     * @returns {*}
     */
    iterativeFindNode(key, cb){

        try{
            if (typeof key === "string") key = Buffer.from(key, "hex");
            Validation.validateIdentity(key);
        }catch(err){
            return cb(err);
        }

        const shortlist = [];
        this._kademliaNode.routingTable.bucketsLookups[ this._kademliaNode.routingTable.getBucketIndex( key ) ] = Date.now();

        const crawlerWorker = new CrawlerWorker(this, this._kademliaNode, shortlist);
        crawlerWorker.process(key, cb )

    }

    iterativeStoreValue(key, value, cb){

        let stored = 0, self = this;
        function dispatchSendStore(contacts, done){
            async.parallelLimit(
                contacts.map( node => done => self._kademliaNode.rules.sendStore( node.contact, key, value, (err, out)=>{
                    stored = err ? stored : stored + 1;
                    done(null, out);
                }) )
            ,global.KAD_OPTIONS.ALPHA_CONCURRENCY, done)
        }

        async.waterfall([
            (next) => this.iterativeFindNode(key, next),
            (contacts, next) => dispatchSendStore(contacts, next),
            (sendStoreOut, next) => self._kademliaNode._store.put(key, value, next )
        ], (err, out)=>{
            cb(null, stored);
        })

    }

    findValue(){

    }



}