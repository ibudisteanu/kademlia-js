const Validation = require('./helpers/validation')

module.exports = class KademliaRules {

    constructor(kademliaNode) {
        this._kademliaNode = kademliaNode;
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
        cb(true);

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

        if (typeof key === "string")  key = Buffer.from(key, 'hex');
        Validation.validateLookup(key);

        if (srcContact) this._kademliaNode.welcomeIfNewNode(srcContact);

        this._kademliaNode._store.put(key.toString('hex'), {
            data: value,
            expiry: new Date().getTime() + global.KAD_OPTIONS.STORE_EXPIRY_TIME,
        }, cb )
    }

    sendStore(contact, key, value, cb){
        this.send(contact,'SEND_STORE', [key, value], cb)
    }

    /**
     * The recipient of the request will return the k nodes in his own buckets that are the closest ones to the requested key.
     * @param key
     * @param cb
     */
    findNode( srcContact, key, cb ){

        if (typeof key === "string")  key = Buffer.from(key, 'hex');
        Validation.validateLookup(key);

        if (srcContact) this._kademliaNode.welcomeIfNewNode(srcContact);

        cb( this._kademliaNode.routingTable.getClosestToKey(key) );
    }

    sendFindNode(contact, key){
        this.send(contact, 'SEND_STORE', [key]);
    }

    /**
     * Same as FIND_NODE, but if the recipient of the request has the requested key in its store, it will return the corresponding value.
     * @param key
     * @param cb
     */
    findValue(srcContact, key, cb){

        if (typeof key === "string")  key = Buffer.from(key, 'hex');
        Validation.validateLookup(key);

        if (srcContact) this._kademliaNode.welcomeIfNewNode(srcContact);

        this._kademliaNode._store.get(key.toString('hex'), (out) => {
            //found the data
            if (out) cb({out: out.data})
            else cb( {list: this._kademliaNode.routingTable.getClosestToKey(key) } )
        })

    }

    sendFindValue(contact, key){
        this.send(contact, 'FIND_VALUE', [key]);
    }

}