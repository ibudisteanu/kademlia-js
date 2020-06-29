const BufferUtils = require('./../helpers/buffer-utils')
const SortsUtils = require('./../helpers/sorts-utils')
const async = require('async')

module.exports = class CrawlerWorker {

    constructor(crawler, kademliaNode, shortlist) {
        this._crawler = crawler;
        this._kademliaNode = kademliaNode;

        this.shortlist = shortlist;
        this._already = {};
        this._banned = {};
        this._countNow = 0;
    }

    process(key, cb){

        if (this.shortlist.length < global.KAD_OPTIONS.BUCKET_COUNT_K)
            this.shortlist = this._kademliaNode.routingTable.getClosestToKey(key, global.KAD_OPTIONS.BUCKET_COUNT_K, this._banned);

        const alphaSelectedContacts = [];

        for (let i=0; i < this.shortlist.length && alphaSelectedContacts.length < global.KAD_OPTIONS.ALPHA_CONCURRENCY; i++) {

            if (this._already[this.shortlist[i].contact.identityHex]) continue;

            const node = this.shortlist[i];
            this._already[node.contact.identityHex] = {
                status: null,
            };
            alphaSelectedContacts.push(node)

        }

        if (alphaSelectedContacts.length === 0){
            return cb(null, this.shortlist);
        }

        async.each( alphaSelectedContacts, (node, done)=>{

            this._kademliaNode.rules.send( node.contact, 'FIND_NODE', [key], (err, results) => {

                if (err) {

                    this._already[node.contact.identityHex].status = false;
                    this._banned[node.contact.identityHex] = true;

                    for (let j=0; j < this.shortlist.length; j++)
                        if (this.shortlist[j] === node) {
                            this.shortlist.splice(j, 1);
                            break;
                        }

                    done(err, results);
                }
                else {
                    this._already[node.contact.identityHex].status = true;

                    async.each( results, (closestNode, done2)=> this._updateContactFound( closestNode.contact, done2 ),
                    (err, out)=>{
                        done(err, results);
                    } )

                }

            })

        }, (err, results)=>{
            this.process(key, cb)
        })

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