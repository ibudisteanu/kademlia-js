const RedBlackTree = require('red-black-tree-js');
const Validation = require('./../../helpers/validation')
const Utils = require('./../../helpers/utils')
const {setAsyncInterval, clearAsyncInterval} = require('./../../helpers/async-interval')

module.exports = function (store){

    store.getSortedList = getSortedList;
    store.putSortedList = putSortedList;
    store.delSortedList = delSortedList;
    store.iteratorSortedList = iteratorSortedList;

    store._getExpirationSortedList = _getExpirationSortedList;
    store._putExpirationSortedList = _putExpirationSortedList;
    store._delExpirationSortedList = _delExpirationSortedList;
    store._iteratorExpirationSortedList = _iteratorExpirationSortedList;

    const _start = store.start.bind(store);
    store.start = start;

    const _stop = store.stop.bind(store);
    store.stop = stop;
    store._expireOldKeysSortedList = _expireOldKeysSortedList;

    store._memorySortedList = new Map();
    store._memorySortedListKeyNodesMap = new Map();

    store._memoryExpirationSortedList = new Map();

    function getSortedList(key, cb){
        if (Buffer.isBuffer(key)) key = key.toString('hex');

        Validation.validateStoreKey(key);

        const tree = this._memorySortedList.get(key);
        if (tree)
            cb( null, tree.toSortedArray() );
        else
            cb( null, undefined );
    }

    function putSortedList(key, value, score, cb){
        if (Buffer.isBuffer(key)) key = key.toString('hex');

        Validation.validateStoreKey(key);
        Validation.validateStoreData(value);

        let tree = this._memorySortedList.get(key);
        if (!tree) {
            tree = new RedBlackTree();
            this._memorySortedList.set(key, tree );
        }

        const foundNode = this._memorySortedListKeyNodesMap.get(key + ':' + value );
        if (foundNode) {

            if (foundNode.key === score)
                return cb(null, 1);
            else {
                //TODO optimization to avoid removing and inserting
                tree.removeNode(foundNode);
            }

        }

        const newNode = tree.insert( score, value );
        this._memorySortedListKeyNodesMap.set(key+':'+value, newNode );

        this._putExpirationSortedList( key, { node: newNode, value, time: Date.now() + global.KAD_OPTIONS.T_STORE_KEY_EXPIRY }, ()=>{
            cb(null, 1);
        });

    }

    function delSortedList(key, value, cb){
        if (Buffer.isBuffer(key)) key = key.toString('hex');

        Validation.validateStoreKey(key);

        const foundNode = this._memorySortedListKeyNodesMap.get(key + ':' + value );
        if (!foundNode) cb(null, 0);

        const tree = this._memorySortedList.get(key);
        tree.removeNode(foundNode);

        this._memorySortedListKeyNodesMap.delete(key+':'+value);
        this._delExpirationSortedList(key+':'+value, ()=>{
            cb(null, 1)
        })
    }


    function _getExpirationSortedList(key, cb){
        if (Buffer.isBuffer(key)) key = key.toString('hex');

        cb( null, this._memoryExpirationSortedList.get(key+':exp') );
    }

    function _putExpirationSortedList(key, { node, value, time }, cb){
        if (Buffer.isBuffer(key)) key = key.toString('hex');

        this._memoryExpirationSortedList.set( key+":"+value+':exp', {
            node,
            value,
            time,
        });

        cb(null, 1);
    }

    function _delExpirationSortedList(key, cb){

        if (Buffer.isBuffer(key)) key = key.toString('hex');

        if (this._memoryExpirationSortedList.get(key)) {
            this._memoryExpirationSortedList.delete(key + ':exp');
            cb(null, 1)
        } else
            cb(null, 0);
    }

    function iteratorSortedList(){
        return this._memorySortedListKeyNodesMap.entries();
    }

    function _iteratorExpirationSortedList(){
        return this._memoryExpirationSortedList.entries();
    }


    function start(){

        _start(...arguments);

        delete this._expireOldKeysSortedListIterator;
        this._asyncIntervalExpireOldKeysSortedList = setAsyncInterval(
            next => this._expireOldKeysSortedList(next),
            global.KAD_OPTIONS.T_STORE_GARBAGE_COLLECTOR + Utils.preventConvoy(5 * 60 * 1000)
        );

    }

    function stop(){

        _stop(...arguments);

        clearAsyncInterval(this._asyncIntervalExpireOldKeysSortedList);
    }

    function _expireOldKeysSortedList(next){

        if (!this._expireOldKeysSortedListIterator)
            this._expireOldKeysSortedListIterator = this._iteratorExpirationSortedList();

        const itValue =  this._expireOldKeysSortedListIterator.next();
        if (itValue.value && !itValue.done){

            const {node, value, time} = it.value[1];
            if (time < Date.now() ){

                const key = itValue.value[0].splice(0, itValue[0].length-4 );
                this.delSortedList(key, value, next )
            }

        } else {
            delete this._expireOldKeysSortedListIterator;
            next()
        }

    }

};
