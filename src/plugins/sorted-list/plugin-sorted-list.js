const PluginSortedListKademliaRules = require('./plugin-sorted-list-kademlia-rules')
const PluginSortedListCrawler = require('./plugin-sorted-list-crawler')
const PluginSortedListStore = require('./plugin-sorted-list-store')

module.exports = function SortedListPlugin(kademliaNode) {

    PluginSortedListKademliaRules( kademliaNode.rules );
    PluginSortedListCrawler( kademliaNode.crawler );
    PluginSortedListStore( kademliaNode._store );

}
