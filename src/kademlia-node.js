const Validation = require('./helpers/validation')
const RoutingTable = require('./routing-table')
const BufferUtils = require('./helpers/buffer-utils')

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
    ping(sourceContact, cb) {

        if (sourceContact) this.welcomeIfNewNode(sourceContact);

        cb(true);
    }

    /**
     * Stores a (key, value) pair in one node.
      * @param key
     * @param value
     * @param cb
     */
    store(sourceContact, key, value, cb) {

        if (typeof key === "string")  key = Buffer.from(key, 'hex');
        Validation.validateLookup(key);

        if (sourceContact) this.welcomeIfNewNode(sourceContact);

        this._store.put(key, {
            data: value,
            expiry: new Date().getTime() + global.KAD_OPTIONS.STORE_EXPIRY_TIME,
        }, cb)
    }

    /**
     * The recipient of the request will return the k nodes in his own buckets that are the closest ones to the requested key.
     * @param key
     * @param cb
     */
    findNode( sourceContact, key, cb ){

        if (typeof key === "string")  key = Buffer.from(key, 'hex');
        Validation.validateLookup(key);

        if (sourceContact) this.welcomeIfNewNode(sourceContact);

        cb( this.routingTable.getClosestToKey(key) );
    }

    /**
     * Same as FIND_NODE, but if the recipient of the request has the requested key in its store, it will return the corresponding value.
     * @param key
     * @param cb
     */
    findValue(sourceContact, key, cb){

        if (typeof key === "string")  key = Buffer.from(key, 'hex');
        Validation.validateLookup(key);

        if (sourceContact) this.welcomeIfNewNode(sourceContact);

        this._store.get(key, (out) => {
            //found the data
            if (out) cb({out: out.data})
            else cb( {list: this.routingTable.getClosestToKey(key) } )
        })

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
    welcomeIfNewNode(contact){

        if (this.routingTable.map[ contact.identityHex ])
            return false;

        for (const key in this._store.map ){
            const keyNode = Buffer.from(key, 'hex');
            const neighbors = this.routingTable.getClosestToKey(contact.identity)

            let newNodeClose, thisClosest;
            if (neighbors.length){
                const last = BufferUtils.xorDistance( neighbors[neighbors.length-1].identity, keyNode );
                newNodeClose = Buffer.compare( BufferUtils.xorDistance( contact.identity, keyNode), last );
                const first = BufferUtils.xorDistance( neighbors[0].identity, keyNode );
                thisClosest = Buffer.compare( BufferUtils.xorDistance( this.contact.identity, keyNode ), first)
            }
            if (!neighbors.length || ( newNodeClose < 0 && thisClosest < 0 ) ) {
                const value = this._store.map[key]
                //TODO!!
                //call_store(node, key, value)
            }
        }

        this.join(contact)

    }

}

