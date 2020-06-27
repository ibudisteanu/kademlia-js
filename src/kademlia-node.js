const Validation = require('./helpers/validation')
const RoutingTable = require('./routing-table')
const BufferUtils = require('./helpers/buffer-utils')
const KademliaRules = require('./kademlia-rules')

module.exports = class KademliaNode {

    constructor(contact, store, options = {}) {

        this.contact = contact;
        this._store = store;
        this.routingTable = new RoutingTable(this);
        this.rules = new (options.KademliaRules || KademliaRules) (this);

    }

    start() {
        if (this._start) throw "Already started";
        this._start = true;
        this.routingTable.start();
        this.rules.start();
    }

    stop() {
        if (!this._start) throw "Already stopped";
        this.routingTable.stop();
        this.rules.stop();
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

