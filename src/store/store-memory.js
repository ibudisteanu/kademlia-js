const Store = require('./store')
const Validation = require ('./../helpers/validation')

module.exports = class StoreMemory extends Store{

    constructor() {
        super();
        this._memory = new Map();
        this._memoryExpiration = new Map();
    }

    iterator(){
        return this._memory.entries();
    }

    _iteratorExpiration(){
        return this._memoryExpiration.entries();
    }

    get(key, cb){
        if (Buffer.isBuffer(key)) key = key.toString('hex');

        Validation.validateStoreKey(key);
        cb( null, this._memory.get(key) );
    }

    put(key, value, cb){

        if (Buffer.isBuffer(key)) key = key.toString('hex');

        Validation.validateStoreKey(key);
        Validation.validateStoreData(value)

        this._memory.set( key, value );
        this._putExpiration(key, Date.now() + global.KAD_OPTIONS.T_STORE_KEY_EXPIRY, ()=>{
            cb( null, 1 );
        });

    }

    del(key, cb){

        if (Buffer.isBuffer(key)) key = key.toString('hex');
        Validation.validateStoreKey(key);

        if (this._memory.get(key)) {
            this._memory.delete(key);
            this._delExpiration(key);
            this.delExpiration(key, ()=>{
                cb(null, true)
            })
        } else
            cb(null, false);
    }


    _getExpiration(key, cb){
        cb( null, this._memoryExpiration.get(key+':exp') );
    }

    _putExpiration(key, time, cb){
        this._memoryExpiration.set(key+':exp', time);
        cb(null, 1);
    }

    _delExpiration(key, cb){

        if (this._memory.get(key)) {
            this._memoryExpiration.delete(key + ':exp');
            cb(null, true)
        } else
            cb(null, false);
    }

}