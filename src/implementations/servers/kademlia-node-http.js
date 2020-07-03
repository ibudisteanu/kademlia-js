const KademliaNode = require('./../../kademlia-node')
const KademliaRulesHTTP = require('./kademlia-rules-http')

module.exports = class KademliaNodeHTTP extends KademliaNode{

    constructor(contact, store, options = {}) {
        super(contact, store, {
            KademliaRules: KademliaRulesHTTP,
            ...options,
        })
    }

}