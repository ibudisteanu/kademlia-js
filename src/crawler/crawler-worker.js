const BufferUtils = require('./../helpers/buffer-utils')
const SortsUtils = require('./../helpers/sorts-utils')

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

        if (this.shortlist.length < global.KAD_OPTIONS.BUCKET_COUNT_K) {
            this.shortlist = this._kademliaNode.routingTable.getClosestToKey(key, global.KAD_OPTIONS.BUCKET_COUNT_K, this._banned);
        }

        for (let i=0; i < this.shortlist.length; i++){

            //all 'threads' had been assigned
            if (this._countNow === global.KAD_OPTIONS.ALPHA_CONCURRENCY ) break;
            const node = this.shortlist[i];

            if (this._already[node.contact.identityHex]) continue;
            this._already[node.contact.identityHex] = {
                status: null,
            };

            this._countNow++;
            this._kademliaNode.rules.send( node.contact, 'FIND_NODE', [key], (err, results) => {

                if (err || results.length === 0) {

                    this._already[node.contact.identityHex].status = false;
                    this._banned[node.contact.identityHex] = true;

                    for (let j=0; j < this.shortlist.length; j++)
                        if (this.shortlist[j] === node) {
                            this.shortlist.splice(j, 1);
                            break;
                        }

                    this._countNow--;
                    this.process(key, cb);

                }
                else {
                    this._already[node.contact.identityHex].status = true;

                    let counter = 0;
                    results.forEach( closestNode =>
                        this._updateContactFound( closestNode.contact, ()=>{
                            counter += 1;
                            if (counter === results.length ){
                                this._countNow--;
                                this.process(key, cb);
                            }
                        } )
                    )
                }

            })

        }

        if (this._countNow === 0)
            cb(null, this.shortlist);

    }

    _updateContactFound(contact, cb){
        this._updateContactFoundNow(contact, (err, tail )=>{
            if (err){
                this._kademliaNode.routingTable.removeContact(tail);
                this._kademliaNode.routingTable.addContact(contact);
                cb(null, contact);
            } else {
                cb(new Error("bucket full"));
            }

        })
    }

    _updateContactFoundNow(contact, cb){

        if (contact.identity.equals( this._kademliaNode.contact.identity) )
            return cb(null, false);

        const [result, bucketIndex, bucketPosition, refreshed ] = this._kademliaNode.routingTable.addContact(contact);
        if (result || refreshed || (!result && !refreshed)) return cb(null, true);

        const tail = this._kademliaNode.routingTable.buckets[bucketIndex].tail;
        if (tail.pingResponded && tail.pingLastCheck > ( Date.now() - 600000 ) )
            return cb(null,)

        this._kademliaNode.rules.sendPing(tail, (err, out)=>{
            tail.pingLastCheck = Date.now();
            tail.pingResponded = false;
            cb(err, tail );
        })

    }

}