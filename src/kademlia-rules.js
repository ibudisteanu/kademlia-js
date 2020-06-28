const Validation = require('./helpers/validation')

module.exports = class KademliaRules {

    constructor(kademliaNode, store) {
        this._kademliaNode = kademliaNode;
        this._store = store;
    }

    send(destContact, command, data, cb){
        throw "not implemented"
    }

    receive(srcContact, command, data, cb){
        if (command === 'PING') return this.ping(srcContact, cb);
        if (command === 'STORE') return this.store(srcContact, data[0], data[1] , cb);
        if (command === 'FIND_NODE') return this.findNode(srcContact, data[0], cb);
        if (command === 'FIND_VALUE') return this.findValue(srcContact, data[0], cb);
        throw "invalid command";
    }

    /**
     * used to verify that a node is still alive.
     * @param cb
     */
    ping(srcContact, cb) {

        if (srcContact) this._kademliaNode.welcomeIfNewNode(srcContact);
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
    store(srcContact, key, value, cb) {

        try{
            if (typeof key === "string")  key = Buffer.from(key, 'hex');
            Validation.validateLookup(key);
        }catch(err){
            return cb(err);
        }

        if (srcContact) this._kademliaNode.welcomeIfNewNode(srcContact);

        this._store.put(key.toString('hex'), value, cb);
    }

    sendStore(contact, key, value, cb){
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

        if (srcContact) this._kademliaNode.welcomeIfNewNode(srcContact);

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

        if (srcContact) this._kademliaNode.welcomeIfNewNode(srcContact);

        this._store.get(key.toString('hex'), (err, out) => {
            //found the data
            if (out) cb(null, {out: out})
            else cb( null, {list: this._kademliaNode.routingTable.getClosestToKey(key) } )
        })

    }

    sendFindValue(contact, key, cb){
        this.send(contact, 'FIND_VALUE', [key], cb);
    }

}