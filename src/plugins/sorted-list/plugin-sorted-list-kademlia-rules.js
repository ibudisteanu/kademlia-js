module.exports = class SortedListKademliaRules {

    constructor(kademliaRules) {

        kademliaRules._commands.FIND_SORTED_LIST = this.findSortedList.bind(kademliaRules);

    }

    findSortedList(){

    }

}