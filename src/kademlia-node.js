const RoutingTable = require('./routing-table/routing-table')
const BufferUtils = require('./helpers/buffer-utils')
const KademliaRules = require('./kademlia-rules')
const Crawler = require('./crawler/crawler')
const NextTick = require('./helpers/next-tick')

module.exports = class KademliaNode {

    constructor(contact, store, options = {}) {

        this.contact = contact;
        this._store = store;
        this.routingTable = new RoutingTable(this);
        this.rules = new (options.KademliaRules || KademliaRules) (this, store);
        this.crawler = new Crawler(this);

        this._started = false;
    }

    //plugin
    use(plugin){

        if (!plugin || typeof plugin !== "function" ) throw "Invalid plugin";
        plugin(this);
    }

    start() {
        if (this._started) throw "Already started";
        this.routingTable.start();
        this.rules.start();
        this._started = true;
    }

    stop() {
        if (!this._started) throw "Already stopped";
        this.routingTable.stop();
        this.rules.stop();
        this._started = false;
    }

    /**
     * Bootstrap by connecting to other known node in the network.
     */
    bootstrap(contact, first, cb = ()=>{} ){
        if (this.routingTable.map[ contact.identityHex ]) return cb(null, [] ); //already

        this.join(contact, first, cb)
    }

    /**
     * Inserts the given contact into the routing table and uses it to perform
     * a find node for this node's identity,
     * then refreshes all buckets further than it's closest neighbor, which will
     * be in the occupied bucket with the lowest index
     */
    join(contact, first = false, cb = ()=>{} ) {
        this.routingTable.addContact(contact);

        this.crawler.iterativeFindNode( this.contact.identity, (err, out)=>{

            if (err) return cb(err, out);

            this.routingTable.refresher.refresh(this.routingTable.getBucketsBeyondClosest().bucketIndex, ()=> {

                if (!first && this.routingTable.count === 1){
                    this.routingTable.removeContact( contact );
                    return cb(new Error("Failed to discover nodes"));
                }
                else{
                    cb(err, out);
                }

            })

        } );
    }



}

