const KademliaRules = require('../../kademlia-rules')

module.exports = class KademliaRulesMock extends KademliaRules {

    constructor(kademliaNode, store) {
        super(kademliaNode, store);
    }

    start() {
        if (!global.KAD_MOCKUP) global.KAD_MOCKUP = {};
        global.KAD_MOCKUP[this._kademliaNode.contact.identityHex] = this;
    }

    stop(){
        delete global.KAD_MOCKUP[this._kademliaNode.contact.identityHex];
    }

    send(destContact, command, data, cb){
        global.KAD_MOCKUP[this._kademliaNode.contact.identityHex].receive( this._kademliaNode.contact.clone(), command, data, cb );
    }

}