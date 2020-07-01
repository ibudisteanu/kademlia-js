const KademliaNode = require('../../kademlia-node')
const KademliaRulesMock = require('./kademlia-rules-mock')

module.exports = class KademliaNodeMock extends KademliaNode {

    constructor(contact, store, options = {}) {
        super(contact, store, {
            KademliaRules: KademliaRulesMock,
            ...options,
        })
    }

    bootstrap(contact, cb = ()=>{} ){
        super.bootstrap(contact, cb );
    }

    join(contact, first, cb = ()=>{} ) {
        super.join(contact, first, cb);
    }

}