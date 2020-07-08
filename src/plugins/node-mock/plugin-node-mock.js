const PluginNodeMockKademliaRules = require('./plugin-node-mock-kademlia-rules')

module.exports = class PluginNodeMock {

    constructor(kademliaNode) {
        new PluginNodeMockKademliaRules(kademliaNode.rules);
    }

}