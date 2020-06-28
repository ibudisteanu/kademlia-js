const KademliaRules = require('../../kademlia-rules')

const MOCKUP_SEND_ERROR_FREQUENCY = 0.01;

module.exports = class KademliaRulesMock extends KademliaRules {

    constructor(kademliaNode, store) {
        super(kademliaNode, store);
    }

    start() {
        if (!global.KAD_MOCKUP) global.KAD_MOCKUP = {};
        global.KAD_MOCKUP[this._kademliaNode.contact.ip+':'+this._kademliaNode.contact.port] = this;
    }

    stop(){
        delete global.KAD_MOCKUP[this._kademliaNode.contact.identityHex];
    }

    send(destContact, command, data, cb){

        if (!global.KAD_MOCKUP[destContact.ip+':'+destContact.port] || Math.random() <= MOCKUP_SEND_ERROR_FREQUENCY )
            return cb( new Error("Message couldn't be sent")  );

        setTimeout(()=>{
            global.KAD_MOCKUP[destContact.ip+':'+destContact.port].receive( this._kademliaNode.contact.clone(), command, data, cb );
        }, Math.floor( Math.random() * 100) + 10)
    }

}