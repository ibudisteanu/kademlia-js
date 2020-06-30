module.exports = class Store{

    constructor() {
        this._started = false;
    }

    start(){
        if (this._start) throw "Store already started";

        if (!this._intervalExpireOldKeys)
            this._createIntervalExpireOldKeys();

        this._started = true;
    }

    stop(){
        if (!this._start) throw "Stor already closed";

        if (this._intervalExpireOldKeys) {
            clearTimeout(this._intervalExpireOldKeys)
            this._intervalExpireOldKeys = undefined;
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

        if (!this._expirationIterator)
            this._expirationIterator = this._iteratorExpiration();

        const itValue =  this._expirationIterator.next();
        if (itValue.value && !itValue.done){
            const time = itValue.value[1];
            if (time < Date.now() ){
                const key = itValue.value[0].splice(0, this._expirationIterator[0].length-4 );
                this.del(key, this._expireOldKeys.bind(this) )
            }
        } else {
            this._createIntervalExpireOldKeys();
        }

    }

    _createIntervalExpireOldKeys(){
        this._expirationIterator = this._iteratorExpiration();
        this._intervalExpireOldKeys = setTimeout(this._expireOldKeys.bind(this), global.KAD_OPTIONS.T_STORE_GARBAGE_COLLECTOR);
    }

}