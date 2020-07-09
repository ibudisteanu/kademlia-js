const PluginNodeMockKademliaRules = require('./plugin-node-mock-kademlia-rules')

module.exports = function PluginNodeMock(kademliaNode) {

    PluginNodeMockKademliaRules(kademliaNode.rules);

}