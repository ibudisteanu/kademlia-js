const Validation = require('./../../helpers/validation')

module.exports = function PluginSortedListCrawler (crawler) {

    crawler.iterativeFindSortedList  = iterativeFindSortedList;
    crawler.iterativeStoreSortedListValue  = iterativeStoreSortedListValue;


    function iterativeFindSortedList(key, cb){

        try{
            if (typeof key === "string") key = Buffer.from(key, "hex");
            Validation.validateIdentity(key);
        }catch(err){
            return cb(err);
        }

        this._kademliaNode._store.getSortedList(key, (err, out)=>{

            if (out) return cb(null, out);
            this._iterativeFind('FIND_SORTED_LIST', 'STORE_SORTED_LIST_VALUE', key, cb);

        });

    }

    function iterativeStoreSortedListValue(key, value, score, cb){
        return this._iterativeStoreValue( [key, value, score], 'storeSortedListValue', (data, next) => this._kademliaNode._store.putSortedList( key, value, score, next ), cb)
    }



}