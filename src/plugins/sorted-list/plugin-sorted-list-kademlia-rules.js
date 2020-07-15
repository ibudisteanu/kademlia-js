const Validation = require('./../../helpers/validation')

module.exports = function SortedListKademliaRules (kademliaRules) {

    kademliaRules._commands.FIND_SORTED_LIST = findSortedList.bind(kademliaRules);
    kademliaRules._commands.STORE_SORTED_LIST_VALUE = storeSortedListValue.bind(kademliaRules);

    kademliaRules.storeSortedListValue = storeSortedListValue;
    kademliaRules.sendStoreSortedListValue = sendStoreSortedListValue;
    kademliaRules.findSortedList = findSortedList;
    kademliaRules.sendFindSortedList = sendFindSortedList;

    function storeSortedListValue(srcContact, [key, value, score], cb){

        try{
            if (typeof key === "string")  key = Buffer.from(key, 'hex');
            Validation.validateLookup(key);
        }catch(err){
            return cb(err);
        }

        if (srcContact) this._welcomeIfNewNode(srcContact);

        this._store.putSortedList(key.toString('hex'), value, score, cb);

    }

    function sendStoreSortedListValue(contact, [key, value, score], cb){

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
    function findSortedList(srcContact, [key], cb){

        try{
            if (typeof key === "string")  key = Buffer.from(key, 'hex');
            Validation.validateLookup(key);
        }catch(err){
            return cb(err);
        }

        if (srcContact) this._welcomeIfNewNode(srcContact);

        this._store.getSortedList(key, (err, out) => {
            //found the data
            if (out) cb(null, [ 1, out ] )
            else cb( null, [ 0, this._kademliaNode.routingTable.getClosestToKey(key) ] )
        })

    }

    function sendFindSortedList(contact, key, cb){
        this.send(contact, 'FIND_SORTED_LIST', [key], cb);
    }


}