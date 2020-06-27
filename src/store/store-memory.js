const Store = require('./store')
const Validation = require ('./../helpers/validation')

module.exports = class StoreMemory extends Store{

    constructor() {
        super();
        this._memory = new Map();
    }

    iterator(){
        return this._memory.entries().next();
    }

    get(key, cb){
        Validation.validateStoreKey(key);
        cb( this._memory.get(key) );
    }

    put(key, value, cb){

        Validation.validateStoreKey(key);
        Validation.validateStoreData(value.data)

        this._memory.set( key, value );
        cb( true );
    }

    del(key, cb){

        Validation.validateStoreKey(key);

        if (this._memory.get(key)) {
            this._memory.delete(key);
            cb(true)
        } else
            cb(false);
    }

}