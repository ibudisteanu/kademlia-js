const RedBlackTree = require('red-black-tree-js');
const Validation= require('./../../helpers/validation')

module.exports = function (store){

    store.getSortedList = getSortedList;
    store.putSortedList = putSortedList;
    store.delSortedList = delSortedList;

    store._memorySortedList = new Map();
    store._memorySortedListKeyNodesMap = new Map();

    store._memorySortedListExpiration = new Map();

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
        Validation.validateStoreData(value)

        let tree = this._memorySortedList.get(key);
        if (!tree) {
            tree = new RedBlackTree();
            this._memorySortedList.set(key, tree );
        }

        const foundNode = this._memorySortedListKeyNodesMap.get(key + ':' + value );
        if (foundNode) {

            if (foundNode.key !== score){
                tree.removeNode(foundNode)
                tree.insert(score, value);
                this._memorySortedListKeyNodesMap.set(key+':'+value,  )
            }else {
                foundNode.value = value;
            }

            return cb(null, 1);
        }

        const newNode = tree.insert( score, value );
        this._memorySortedListKeyNodesMap.set(key+':'+value, newNode );

        cb(null, 1);
    }

    function delSortedList(key, value, cb){
        if (Buffer.isBuffer(key)) key = key.toString('hex');

        Validation.validateStoreKey(key)

        const foundNode = this._memorySortedListKeyNodesMap.get(key + ':' + value );
        if (!foundNode) cb(null, 0);

        const tree = this._memorySortedList.get(key);
        tree.removeNode(foundNode);

        this._memorySortedListKeyNodesMap.delete(key+':'+value);

    }

}