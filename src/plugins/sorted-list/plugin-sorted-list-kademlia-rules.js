const Validation = require('./../../helpers/validation')

module.exports = function SortedListKademliaRules (kademliaRules) {

    kademliaRules._commands.FIND_SORTED_LIST = findSortedList.bind(kademliaRules);
    kademliaRules._commands.STORE_SORTED_LIST_VALUE = storeSortedListValue.bind(kademliaRules);

    kademliaRules._allowedStoreSortedListTables = {
        '': true,
    };

    kademliaRules.storeSortedListValue = storeSortedListValue;
    kademliaRules.sendStoreSortedListValue = sendStoreSortedListValue;
    kademliaRules.findSortedList = findSortedList;
    kademliaRules.sendFindSortedList = sendFindSortedList;

    function storeSortedListValue(srcContact, [table, key, value, score], cb){

        if (!this._allowedStoreSortedListTables[table.toString('hex')])
            return cb(new Error('Table is not allowed'));

        if (srcContact) this._welcomeIfNewNode(srcContact);

        this._store.putSortedList(table.toString('hex'), key.toString('hex'), value, score, cb);

    }

    function sendStoreSortedListValue(contact, [table, key, value, score], cb){

        if (!this._allowedStoreSortedListTables[table.toString('hex')])
            return cb(new Error('Table is not allowed'));

        this.send(contact,'STORE_SORTED_LIST_VALUE', [table, key, value, score], cb)

    }


    /**
     * Same as FIND_NODE, but if the recipient of the request has the requested key in its store, it will return the corresponding value.
     * @param key
     * @param cb
     */
    function findSortedList(srcContact, [table, key], cb){

        if (srcContact) this._welcomeIfNewNode(srcContact);

        this._store.getSortedList(table.toString('hex'), key.toString('hex'), (err, out) => {
            //found the data
            if (out) cb(null, [ 1, out ] )
            else cb( null, [ 0, this._kademliaNode.routingTable.getClosestToKey(key) ] )
        })

    }

    function sendFindSortedList(contact, table, key, cb){
        this.send(contact, 'FIND_SORTED_LIST', [table, key], cb);
    }


}