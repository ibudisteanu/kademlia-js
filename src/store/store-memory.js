const Store = require('./store')
const Validation = require ('./../helpers/validation')

module.exports = class StoreMemory extends Store{

    constructor() {
        super();
        this._memory = {};
    }

    get(key, cb){
        Validation.validateStoreKey(key);
        cb( this._memory[key] );
    }

    put(key, value, cb){

        Validation.validateStoreKey(key);
        Validation.validateStoreData(value.data)

        this._memory[ key ] = value;
        cb( true );
    }

    del(key, cb){

        Validation.validateStoreKey(key);

        if (this._memory[key]) {
            delete this._memory[key];
            cb(true)
        } else
            cb(false);
    }

}