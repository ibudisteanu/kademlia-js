const RoutingTable = require('./routing-table/routing-table')
const BufferUtils = require('./helpers/buffer-utils')
const KademliaRules = require('./kademlia-rules')
const Crawler = require('./crawler/crawler')

module.exports = class KademliaNode {

    constructor(contact, store, options = {}) {

        this.contact = contact;
        this._store = store;
        this.routingTable = new RoutingTable(this);
        this.rules = new (options.KademliaRules || KademliaRules) (this, store);
        this.crawler = new Crawler(this);

        this._started = false;
    }

    start() {
        if (this._started) throw "Already started";
        this._started = true;
        this.routingTable.start();
        this.rules.start();
        this._store.start();
    }

    stop() {
        if (!this._started) throw "Already stopped";
        this.routingTable.stop();
        this.rules.stop();
        this._store.stop();
        this._started = false;
    }

    /**
     * Bootstrap by connecting to other known node in the network.
     */
    bootstrap(contact, cb){
        if (this.routingTable.map[ contact.identityHex ]) return cb(null, false); //already

        this.join(contact, cb)
    }

    /**
     * Inserts the given contact into the routing table and uses it to perform
     * a find node for this node's identity,
     * then refreshes all buckets further than it's closest neighbor, which will
     * be in the occupied bucket with the lowest index
     */
    join(contact, cb) {
        this.routingTable.addContact(contact);

        this.crawler.iterativeFindNode( this.contact.identity, (err, out)=>{

            console.log("1111")
            if (err) return cb(err, out);

            this.routingTable.refresher.refresh(this.routingTable.getBucketsBeyondClosest().bucketIndex, (err, out)=>{

                if (this.routingTable.count === 1){
                    this.routingTable.removeContact( this.routingTable.map[contact.identityHex]);
                    return cb(new Error("Failed to discover nodes"));
                }
                else cb(err, out);

            })

        } );
    }

    /**
     *  Given a new node, send it all the keys/values it should be storing,
         then add it to the routing table.
         @param contact: A new node that just joined (or that we just found out about).
         Process:
         For each key in storage, get k closest nodes.  If newnode is closer
         than the furtherst in that list, and the node for this server
         is closer than the closest in that list, then store the key/value
         on the new node (per section 2.5 of the paper)
     */
    welcomeIfNewNode(contact, iterator){

        if (this.routingTable.map[ contact.identityHex ] || contact.identity.equals( this.contact.identity ))
            return false;

        if (!iterator ) {
            iterator = this._store.iterator();
            this.routingTable.addContact(contact);
        }

        let itValue = iterator.next();

        while (itValue.value && !itValue.done) {

            const key = itValue.value[0];
            const value = itValue.value[1];

            const keyNode = Buffer.from(key, 'hex');
            const neighbors = this.routingTable.getClosestToKey(contact.identity)

            let newNodeClose, thisClosest;
            if (neighbors.length){
                const last = BufferUtils.xorDistance( neighbors[neighbors.length-1].identity, keyNode );
                newNodeClose = Buffer.compare( BufferUtils.xorDistance( contact.identity, keyNode), last );
                const first = BufferUtils.xorDistance( neighbors[0].identity, keyNode );
                thisClosest = Buffer.compare( BufferUtils.xorDistance( this.contact.identity, keyNode ), first)
            }

            if (!neighbors.length || ( newNodeClose < 0 && thisClosest < 0 )  ) {
                this.rules.sendStore(contact, key, value, out => {

                    if (out)
                        setTimeout(this.welcomeIfNewNode.bind(this, contact, iterator), 100)

                });
                return;
            } else
                itValue = iterator.next();

        }

    }


}

