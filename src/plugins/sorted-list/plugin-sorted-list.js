const PluginSortedListKademliaRules = require('./plugin-sorted-list-kademlia-rules')

module.exports = class SortedListPlugin {

    constructor(kademliaNode) {
        new PluginSortedListKademliaRules( kademliaNode.rules );
    }

}
