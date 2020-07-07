const Validation = require('./helpers/validation')
const BufferUtils = require('./helpers/buffer-utils')
const NextTick = require('./helpers/next-tick')
const {setAsyncInterval, clearAsyncInterval} = require('./helpers/async-interval')
const {preventConvoy} = require('./helpers/utils')

module.exports = class KademliaRules {

    constructor(kademliaNode, store) {
        this._kademliaNode = kademliaNode;
        this._store = store;
        this._replicatedStoreToNewNodesAlready = {};
    }

    start(){
        /**
         * USED to avoid memory leaks, from time to time, we have to clean this._replicatedStoreToNewNodesAlready
         * @private
         */
        this._asyncIntervalReplicatedStoreToNewNodeExpire = setAsyncInterval(
            next => this._replicatedStoreToNewNodeExpire(next),
            global.KAD_OPTIONS.T_REPLICATE_TO_NEW_NODE_EXPIRY +  preventConvoy(global.KAD_OPTIONS.T_REPLICATE_TO_NEW_NODE_EXPIRY_CONVOY),
        );
    }

    stop(){
        clearAsyncInterval(this._asyncIntervalReplicatedStoreToNewNodeExpire)
    }

    send(destContact, command, data, cb){
        throw "not implemented"
    }

    receive(srcContact, command, data, cb){
        if (command === 'PING') return this.ping(srcContact, cb);
        if (command === 'STORE') return this.store(srcContact, data, cb);
        if (command === 'FIND_NODE') return this.findNode(srcContact, data[0], cb);
        if (command === 'FIND_VALUE') return this.findValue(srcContact, data[0], cb);
        throw "invalid command";
    }

    /**
     * used to verify that a node is still alive.
     * @param cb
     */
    ping(srcContact, cb) {

        if (srcContact) this._welcomeIfNewNode(srcContact);
        cb(null, true);

    }

    sendPing(contact, cb){
        this.send(contact,'PING', [true],  cb);
    }

    /**
     * Stores a (key, value) pair in one node.
     * @param key
     * @param value
     * @param cb
     */
    store(srcContact, [key, value], cb) {

        try{
            if (typeof key === "string")  key = Buffer.from(key, 'hex');
            Validation.validateLookup(key);
        }catch(err){
            return cb(err);
        }

        if (srcContact) this._welcomeIfNewNode(srcContact);

        this._store.put(key.toString('hex'), value, cb);
    }

    sendStore(contact, [key, value], cb){

        try{
            if (typeof key === "string")  key = Buffer.from(key, 'hex');
            Validation.validateLookup(key);
        }catch(err){
            return cb(err);
        }

        this.send(contact,'STORE', [key, value], cb)
    }

    /**
     * The recipient of the request will return the k nodes in his own buckets that are the closest ones to the requested key.
     * @param key
     * @param cb
     */
    findNode( srcContact, key, cb ){

        try{
            if (typeof key === "string")  key = Buffer.from(key, 'hex');
            Validation.validateLookup(key);
        }catch(err){
            return cb(err);
        }

        if (srcContact) this._welcomeIfNewNode(srcContact);

        cb( null, this._kademliaNode.routingTable.getClosestToKey(key) );
    }

    sendFindNode(contact, key, cb){
        this.send(contact, 'FIND_NODE', [key], cb);
    }

    /**
     * Same as FIND_NODE, but if the recipient of the request has the requested key in its store, it will return the corresponding value.
     * @param key
     * @param cb
     */
    findValue(srcContact, key, cb){

        try{
            if (typeof key === "string")  key = Buffer.from(key, 'hex');
            Validation.validateLookup(key);
        }catch(err){
            return cb(err);
        }

        if (srcContact) this._welcomeIfNewNode(srcContact);

        this._store.get(key.toString('hex'), (err, out) => {
            //found the data
            if (out) cb(null, out )
            else cb( null, this._kademliaNode.routingTable.getClosestToKey(key) )
        })

    }

    sendFindValue(contact, key, cb){
        this.send(contact, 'FIND_VALUE', [key], cb);
    }


    /**
     *  Given a new node, send it all the keys/values it should be storing,
     *  then add it to the routing table.
     *  @param contact: A new node that just joined (or that we just found out about).
     *  Process:
     */
    _welcomeIfNewNode(contact, cb = ()=>{} ){

        if (this._kademliaNode.routingTable.map[ contact.identityHex ] || contact.identity.equals( this._kademliaNode.contact.identity ))
            return cb(null, "already");

        this._kademliaNode.routingTable.addContact(contact);

        if (this._replicatedStoreToNewNodesAlready[contact.identityHex])
            return cb(null, "skipped");

        this._replicatedStoreToNewNodesAlready[contact.identityHex] = Date.now();
        this._replicateStoreToNewNode(contact, undefined, cb )

    }

    /**
     * For each key in storage, get k closest nodes.  If newnode is closer
     * than the furtherst in that list, and the node for this server
     * is closer than the closest in that list, then store the key/value
     * on the new node (per section 2.5 of the paper)
     * @param contact
     * @param iterator
     * @private
     */
    _replicateStoreToNewNode(contact, iterator, cb){

        if (!iterator )  //first time
            iterator = this._store.iterator();

        let itValue = iterator.next();

        while (itValue.value && !itValue.done) {

            const key = itValue.value[0];
            const value = itValue.value[1];

            const keyNode = Buffer.from(key, 'hex');
            const neighbors = this._kademliaNode.routingTable.getClosestToKey(contact.identity)

            let newNodeClose, thisClosest;
            if (neighbors.length){
                const last = BufferUtils.xorDistance( neighbors[neighbors.length-1].identity, keyNode );
                newNodeClose = Buffer.compare( BufferUtils.xorDistance( contact.identity, keyNode), last );
                const first = BufferUtils.xorDistance( neighbors[0].identity, keyNode );
                thisClosest = Buffer.compare( BufferUtils.xorDistance( this._kademliaNode.contact.identity, keyNode ), first)
            }

            if (!neighbors.length || ( newNodeClose < 0 && thisClosest < 0 )  )
                return this.sendStore(contact, [key, value], (err, out) => {

                    if (err)
                        return cb(err); //error

                    NextTick( this._replicateStoreToNewNode.bind(this, contact, iterator, cb), global.KAD_OPTIONS.T_REPLICATE_TO_NEW_NODE_SLEEP )

                });
            else
                itValue = iterator.next();

        }

        if (!itValue.value || !itValue.done)
            cb(null, "done");

    }

    /**
     * Clear expired _replicatedStoreToNewNodesAlready
     * @private
     */
    _replicatedStoreToNewNodeExpire(next){
        
        const expiration = new Date() - global.KAD_OPTIONS.T_REPLICATE_TO_NEW_NODE_EXPIRY;
        for (const identityHex in this._replicatedStoreToNewNodesAlready)
            if (this._replicatedStoreToNewNodesAlready[identityHex] < expiration )
                delete this._replicatedStoreToNewNodesAlready[identityHex];

        next()
    }

}