const KademliaNode = require('../../kademlia-node')
const KademliaRulesMock = require('./kademlia-rules-mock')

module.exports = class KademliaNodeMock extends KademliaNode {

    constructor(contact, store, options = {}) {
        super(contact, store, {
            KademliaRules: KademliaRulesMock,
            ...options,
        })
    }

    bootstrap(contact, first, cb = ()=>{} ){
        super.bootstrap(contact, first, cb );
    }

    join(contact, first, cb = ()=>{} ) {
        super.join(contact, first, cb);
    }

}