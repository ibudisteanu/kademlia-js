const PluginNodeHTTPKademliaRules = require('./plugin-node-http-kademlia-rules')

module.exports = function (kademliaNode){
    PluginNodeHTTPKademliaRules(kademliaNode.rules)
}