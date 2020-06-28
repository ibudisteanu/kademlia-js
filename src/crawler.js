const async = require('async');
const Validation = require('./helpers/validation')
const BufferUtils = require('./helpers/buffer-utils')

module.exports = class Crawler {

    constructor(kademliaNode) {
        this._kademliaNode = kademliaNode;
        this._lookups = new Map();
    }

    iterativeFindNode(key, cb){

        try{
            if (typeof key === "string") key = Buffer.from(key, "hex");
            Validation.validateIdentity(key);
        }catch(err){
            return cb(err);
        }

        const closestNodes = this._kademliaNode.routingTable.getClosestToKey(key, global.KAD_OPTIONS.ALPHA_CONCURRENCY);
        this._lookups.set( this._kademliaNode.routingTable.getBucketIndex( key ), Date.now() );

        async.mapSeries(closestNodes, ( closestNode, next ) => {
            this._kademliaNode.rules.send( closestNode.contact, 'FIND_NODE', [key], (err, results) => next(null, results || []))
        }, (err, results) => {
            results = results.reduce((acc, result) => acc.concat(result), [] )
                             .sort( (a,b) => BufferUtils.compareKeyBuffers( a.contact.identity, b.contact.identity )  )

            results.forEach( closestNode => this._updateContactFound( closestNode.contact ) )
            cb(null, results.splice(0, global.KAD_OPTIONS.BUCKET_COUNT_K))
        } )

    }

    storeValue(key, value, cb){
        async.waterfall([
            (next) => this.findNode(key, value),
            (contacts, next) => this._kademliaNode.routes.sendStore()
        ])
    }

    findValue(){

    }

    _updateContactFound(contact){
        this._updateContactFoundNow(contact, (err, tail )=>{
            if (err){
                this._kademliaNode.routingTable.removeContact(tail);
                this._kademliaNode.routingTable.addContact(contact);
            }
        })
    }

    _updateContactFoundNow(contact, cb){

        if (contact.identity.equals( this._kademliaNode.contact.identity) )
            cb(false);

        const [result, bucketIndex, bucketPosition, refreshed ] = this._kademliaNode.routingTable.addContact(contact);
        if (result === true) return cb(null, true);
        if (refreshed) return cb(null, true)

        const tail = this._kademliaNode.routingTable.buckets[bucketIndex].tail;
        if (tail.pingResponded && tail.pingLastCheck > ( Date.now() - 600000 ) )
            return cb()

        this._kademliaNode.rules.sendPing(tail, (err, out)=>{
            tail.pingLastCheck = Date.now();
            tail.pingResponded = false;
            cb(err, tail );
        })

    }

}