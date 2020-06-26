const Validation = require('./helpers/validation')
const RoutingTable = require('./routing-table')

module.exports = class KademliaNode {

    constructor(contact, store) {

        this.contact = contact;
        this._store = store;
        this.routingTable = new RoutingTable(this);

    }

    start() {
        if (this._start) throw "Already started";
        this._start = true;
        this.routingTable.start();
    }

    stop() {
        if (!this._start) throw "Already stopped";
        this.routingTable.stop();
        this._start = false;
    }

    /**
     * Inserts the given contact into the routing table and uses it to perform
     * a find node for this node's identity,
     * then refreshes all buckets further than it's closest neighbor, which will
     * be in the occupied bucket with the lowest index
     */
    join(contact) {
        this.routingTable.addContact(contact)
    }

    /**
     * used to verify that a node is still alive.
     * @param cb
     */
    ping(cb) {
        cb(true);
    }

    /**
     * Stores a (key, value) pair in one node.
      * @param key
     * @param value
     * @param cb
     */
    store(key, value, cb) {
        this._store.put(key, value, cb)
    }

    /**
     * The recipient of the request will return the k nodes in his own buckets that are the closest ones to the requested key.
     * @param key
     * @param cb
     */
    findNode( key, cb ){
        cb( this.routingTable.getClosestToKey(key) );
    }

    /**
     * Same as FIND_NODE, but if the recipient of the request has the requested key in its store, it will return the corresponding value.
     * @param key
     * @param cb
     */
    findValue(key, cb){

        this._store.get(key, (out) => {
            //found the data
            if (out) cb(out)
            else cb( this.routingTable.getClosestToKey(key) )
        })

    }

}

