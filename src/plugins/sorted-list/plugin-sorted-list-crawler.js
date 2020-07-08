const Validation = require('./../../helpers/validation')

module.exports = class PluginSortedListCrawler {

    constructor(crawler) {
        crawler.iterativeFindSortedList  = this.iterativeFindSortedList;
        crawler.iterativeStoreSortedListValue  = this.iterativeStoreSortedListValue;
    }

    iterativeFindSortedList(key, cb){

        try{
            if (typeof key === "string") key = Buffer.from(key, "hex");
            Validation.validateIdentity(key);
        }catch(err){
            return cb(err);
        }

        this._kademliaNode._store.get(key, (err, out)=>{

            if (out) return cb(null, out);
            this._iterativeFind('FIND_SORTED_LIST', 'STORE_SORTED_LIST_VALUE', key, cb);

        });

    }

    iterativeStoreSortedListValue(key, value, score, cb){
        return this._iterativeStoreValue( [key, value, score], 'storeSortedListValue', cb)
    }

}