const NextTick = require('./../helpers/next-tick')
const {setAsyncInterval, clearAsyncInterval} = require('./../helpers/async-interval')
const Utils = require('./../helpers/utils')

module.exports = class Store{

    constructor() {
        this._started = false;
    }

    start(){
        if (this._started) throw "Store already started";

        this._asyncIntervalExpireOldKeys = setAsyncInterval(
            this._expireOldKeys.bind(this),
            global.KAD_OPTIONS.T_STORE_GARBAGE_COLLECTOR + Utils.preventConvoy(5 * 60 * 1000)
        );

        this._started = true;
    }

    stop(){
        if (!this._started) throw "Store already closed";

        clearAsyncInterval(this._asyncIntervalExpireOldKeys);

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

    _expireOldKeys(cb, iterator){

        if (!iterator)
            iterator = this._iteratorExpiration();

        const itValue =  iterator.next();
        if (itValue.value && !itValue.done){
            const time = itValue.value[1];
            if (time < Date.now() ){
                const key = itValue.value[0].splice(0, itValue[0].length-4 );
                this.del(key, () => NextTick( this._expireOldKeys.bind(this, cb, iterator), gobal.KAD_OPTIONS.T_STORE_GARBAGE_COLLECTOR_SLEEP ) )
            }
        } else
            cb()

    }


}