const KademliaNode = require('../../kademlia-node')
const KademliaRulesMock = require('./kademlia-rules-mock')

module.exports = class KademliaNodeMock extends KademliaNode {

    constructor(contact, store, options = {}) {
        super(contact, store, {
            KademliaRules: KademliaRulesMock,
            ...options,
        })
    }

}