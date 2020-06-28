const BufferUtils = require('./../helpers/buffer-utils')
const SortsUtils = require('./../helpers/sorts-utils')

module.exports = class CrawlerWorker {

    constructor(crawler, kademliaNode, shortlist) {
        this._crawler = crawler;
        this._kademliaNode = kademliaNode;

        this.shortlist = shortlist;
        this._already = {};
        this._countNow = 0;
    }

    process(key, cb){

        if (this.shortlist.length < global.KAD_OPTIONS.BUCKET_COUNT_K) {
            this.shortlist = this._kademliaNode.routingTable.getClosestToKey(key, global.KAD_OPTIONS.BUCKET_COUNT_K, this.shortlist);
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
                    for (let j=0; j < this.shortlist.length; j++)
                        if (this.shortlist[j] === node) {
                            this.shortlist.splice(j, 1);
                            break;
                        }

                }
                else {
                    this._already[node.contact.identityHex].status = true;

                    results.forEach( closestNode => {

                        this._updateContactFound( closestNode.contact, ()=>{} )
                        const distance = BufferUtils.xorDistance( closestNode.contact.identity, key );
                        for (let j=0; j < this.shortlist.length ; j++)
                            if (this.shortlist[j].distance > distance){
                                for (let q=0; q < this.shortlist.length-1 ;q++)
                                    this.shortlist[q] = this.shortlist[q+1]

                                this.shortlist[j] = closestNode;
                                this.shortlist.splice(global.KAD_OPTIONS.BUCKET_COUNT_K);
                                break;
                            }
                    } )
                }

                this._countNow--;
                setTimeout(this.process.bind(this, key, cb), 1) //to avoid stack over flow

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
            }

            cb(err, contact);
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