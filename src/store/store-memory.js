const Store = require('./store')

module.exports = class StoreMemory extends Store{

    constructor() {
        super();
        this._memory = {};
    }

    get(key, cb){
        cb( this._memory[key] );
    }

    put(key, value, cb){
        this._memory[key] = value;
        cb( value );
    }

    del(key, cb){
        if (this._memory[key]) {
            delete this._memory[key];
            cb(true)
        } else
            cb(false);
    }

}