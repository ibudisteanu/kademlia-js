module.exports = class Store{

    constructor() {
        this._started = false;
    }

    start(){
        if (this._start) throw "Store already started";

        this._started = true;
        if (!this._timeoutExpireOldKeys) {
            this._expirationIterator = undefined;
            this._createTimeoutExpireOldKeys();
        }

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

        if (!this._expirationIterator || this._expirationIterator.done)
            this._expirationIterator = this._iteratorExpiration();

        if (!this._expirationIterator.done){
            const time = this._expirationIterator[1];
            if (time < Date.now() ){
                const key = this._expirationIterator[0].splice(0, this._expirationIterator[0].length-4 );
                this.del(key, ()=> this._createTimeoutExpireOldKeys() )
            }
        } else {
            this._createTimeoutExpireOldKeys();
        }

    }

    _createTimeoutExpireOldKeys(){
        this._timeoutExpireOldKeys = setTimeout(this._expireOldKeys.bind(this), global.KAD_OPTIONS.T_STORE_GARBAGE_COLLECTOR);
    }

}