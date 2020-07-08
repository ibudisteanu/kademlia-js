const PluginNodeHTTPKademliaRules = require('./plugin-node-http-kademlia-rules')

module.exports = class PluginNodeHTTP{

    constructor(kademliaNode){
        new PluginNodeHTTPKademliaRules(kademliaNode.rules)
    }

}