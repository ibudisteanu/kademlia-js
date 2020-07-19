const PluginNodeHTTPKademliaRules = require('./plugin-node-http-kademlia-rules')

module.exports = function (kademliaNode){

    PluginNodeHTTPKademliaRules(kademliaNode.rules);

    return {
        name: "PluginNodeHttp",
        version: "0.1",
        success: true,
    }
}
