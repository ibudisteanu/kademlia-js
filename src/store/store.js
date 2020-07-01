const NextTick = require('./../helpers/next-tick')

module.exports = class Store{

    constructor() {
        this._started = false;
    }

    start(){
        if (this._start) throw "Store already started";

        if (!this._timeoutExpireOldKeys)
            this._createIntervalExpireOldKeys();

        this._started = true;
    }

    stop(){
        if (!this._start) throw "Stor already closed";

        if (this._timeoutExpireOldKeys) {
            clearTimeout(this._timeoutExpireOldKeys)
            this._timeoutExpireOldKeys = undefined;
        }
        this._started = false;
    }

    iterator(){
    }

    _iteratorExpiration(){
    }

    get(key, cb){
    }

    put(key, value, cb){
    }

    del(key, cb){
    }

    getExpiration(key, cb){
    }

    putExpiration(key, time, cb){
    }

    delExpiration(key, cb){
    }

    _expireOldKeys(){

        const itValue =  this._expirationIterator.next();
        if (itValue.value && !itValue.done){
            const time = itValue.value[1];
            if (time < Date.now() ){
                const key = itValue.value[0].splice(0, itValue[0].length-4 );
                this.del(key, () => NextTick( this._expireOldKeys.bind(this), gobal.KAD_OPTIONS.T_STORE_GARBAGE_COLLECTOR_SLEEP ) )
            }
        } else {
            this._createIntervalExpireOldKeys();
        }

    }

    _createIntervalExpireOldKeys(){
        this._expirationIterator = this._iteratorExpiration();
        this._timeoutExpireOldKeys = setTimeout(this._expireOldKeys.bind(this), global.KAD_OPTIONS.T_STORE_GARBAGE_COLLECTOR);
    }

}