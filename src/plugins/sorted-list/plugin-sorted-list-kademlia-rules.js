const Validation = require('./../../helpers/validation')

module.exports = class SortedListKademliaRules {

    constructor(kademliaRules) {

        kademliaRules._commands.FIND_SORTED_LIST = this.findSortedList.bind(kademliaRules);
        kademliaRules._commands.STORE_SORTED_LIST_VALUE = this.storeSortedListValue.bind(kademliaRules);

    }


    storeSortedListValue(srcContact, [key, value, score], cb){

        try{
            if (typeof key === "string")  key = Buffer.from(key, 'hex');
            Validation.validateLookup(key);
        }catch(err){
            return cb(err);
        }

        if (srcContact) this._welcomeIfNewNode(srcContact);

        this._store.putSorted(key.toString('hex'), value, score, cb);

    }

    sendStoreSortedListValue(contact, [key, value, score], cb){

        try{
            if (typeof key === "string")  key = Buffer.from(key, 'hex');
            Validation.validateLookup(key);
        }catch(err){
            return cb(err);
        }

        this.send(contact,'STORE_SORTED_LIST_VALUE', [key, value, score], cb)
    }


    /**
     * Same as FIND_NODE, but if the recipient of the request has the requested key in its store, it will return the corresponding value.
     * @param key
     * @param cb
     */
    findSortedList(srcContact, [key], cb){

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

    sendFindSortedList(contact, key, cb){
        this.send(contact, 'FIND_SORTED_LIST', [key], cb);
    }


}