const PluginSortedListKademliaRules = require('./plugin-sorted-list-kademlia-rules')
const PluginSortedListCrawler = require('./plugin-sorted-list-crawler')

module.exports = class SortedListPlugin {

    constructor(kademliaNode) {
        new PluginSortedListKademliaRules( kademliaNode.rules );
        new PluginSortedListCrawler( kademliaNode.crawler );
    }

}
