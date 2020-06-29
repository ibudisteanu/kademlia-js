const BufferUtils = require('./../helpers/buffer-utils')
const SortsUtils = require('./../helpers/sorts-utils')
const async = require('async')
const ContactList = require('./contact-list')

module.exports = class CrawlerWorker {

    constructor(crawler, kademliaNode) {
        this._crawler = crawler;
        this._kademliaNode = kademliaNode;
    }

    iterativeFind(method, key, cb){

        this._kademliaNode.routingTable.bucketsLookups[ this._kademliaNode.routingTable.getBucketIndex( key ) ] = Date.now();

        const shortlist = new ContactList( key, this._kademliaNode.routingTable.getClosestToKey(key, global.KAD_OPTIONS.BUCKET_COUNT_K ) );
        let closest = shortlist.closest;

        let finished = false;

        function dispatchFindNode(contact, next){

            if (finished) return next(null, null)

            //mark this node as contacted so as to avoid repeats
            shortlist.contacted(contact);

            this._kademliaNode.rules.send(contact, 'FIND_NODE', [key], (err, result) => {

                if (finished || err) return next(null, null);

                // mark this node as active to include it in any return values
                shortlist.responded(contact);

                //If the result is a contact/node list, just keep track of it
                if ( Array.isArray(result) || method !== 'FIND_VALUE' ){
                    const added = shortlist.add(result);
                    //If it wasn't in the shortlist, we haven't added to the routing table, so do that now.
                    added.forEach(contact => this._updateContactFound(contact, () => { } ));
                    next(null, result);
                } else {

                    //If we did get an item back, get the closest node we contacted
                    //who is missing the value and store a copy with them
                    const closestMissingValue = shortlist.active[0];

                    if (closestMissingValue)
                        this._kademliaNode.rules.send(closestMissingValue, 'STORE', [key, result ], () => null );

                    //  we found a value, so stop searching
                    finished = true;
                    cb(null, { result, contact });
                    next(null, result);
                }

            })
        }

        function iterativeLookup(selection, continueLookup = true) {

            //nothing new to do
            if ( !selection.length )
                return cb(null, shortlist.active.slice(0, global.KAD_OPTIONS.BUCKET_COUNT_K) );

            async.each( selection, dispatchFindNode.bind(this),
                (err, results)=>{

                    if (finished) return;

                    // If we have reached at least K active nodes, or haven't found a
                    // closer node, even on our finishing trip, return to the caller
                    // the K closest active nodes.
                    if (shortlist.active.length >= global.KAD_OPTIONS.BUCKET_COUNT_K || (closest === shortlist.closest && !continueLookup) )
                        return cb(null, shortlist.active.slice(0, global.KAD_OPTIONS.BUCKET_COUNT_K));

                    // NB: we haven't discovered a closer node, call k uncalled nodes and
                    // NB: finish up
                    if (closest === shortlist.closest)
                        return iterativeLookup.call(this, shortlist.uncontacted.slice(0, global.KAD_OPTIONS.BUCKET_COUNT_K), false );

                    closest = shortlist.closest;

                    //continue the lookup with ALPHA close, uncontacted nodes
                    iterativeLookup.call(this, shortlist.uncontacted.slice(0, global.KAD_OPTIONS.ALPHA_CONCURRENCY), true );
                })

        }

        iterativeLookup.call(this, shortlist.uncontacted.slice(0, global.KAD_OPTIONS.ALPHA_CONCURRENCY), true);

    }

    _updateContactFound(contact, cb){
        this._updateContactFoundNow(contact, (err, tail )=>{
            if (err) return cb(err, null);

            if (tail && typeof tail === "object"){
                this._kademliaNode.routingTable.removeContact(tail);
                this._kademliaNode.routingTable.addContact(contact);
                return cb(null, contact);
            }
            cb(null, null);

        })
    }

    _updateContactFoundNow(contact, cb){

        if (contact.identity.equals( this._kademliaNode.contact.identity) )
            return cb(null, null);

        const [result, bucketIndex, bucketPosition, refreshed ] = this._kademliaNode.routingTable.addContact(contact);
        if (result || refreshed || (!result && !refreshed))
            return cb(null, true);

        const tail = this._kademliaNode.routingTable.buckets[bucketIndex].tail;
        if (tail.pingResponded && tail.pingLastCheck > ( Date.now() - 600000 ) )
            return cb( "bucket full",)

        this._kademliaNode.rules.sendPing(tail, (err, out)=>{
            tail.pingLastCheck = Date.now();
            tail.pingResponded = false;
            cb(null, tail );
        })

    }

}