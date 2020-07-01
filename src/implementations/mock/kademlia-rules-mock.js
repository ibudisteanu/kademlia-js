const KademliaRules = require('../../kademlia-rules')

const MOCKUP_SEND_ERROR_FREQUENCY = 0.01;

module.exports = class KademliaRulesMock extends KademliaRules {

    constructor(kademliaNode, store) {
        super(kademliaNode, store);
    }

    start() {
        if (!global.KAD_MOCKUP) global.KAD_MOCKUP = {};
        global.KAD_MOCKUP[this._kademliaNode.contact.hostname+':'+this._kademliaNode.contact.port] = this;
    }

    stop(){
        delete global.KAD_MOCKUP[this._kademliaNode.contact.identityHex];
    }

    send(destContact, command, data, cb){

        //fake some unreachbility
        if (!global.KAD_MOCKUP[destContact.hostname+':'+destContact.port] || Math.random() <= MOCKUP_SEND_ERROR_FREQUENCY ) {
            console.error("LOG: Message couldn't be sent", command, destContact);
            return cb(new Error("Message couldn't be sent"), null);
        }

        setTimeout(()=>{
            global.KAD_MOCKUP[destContact.hostname+':'+destContact.port].receive( this._kademliaNode.contact.clone(), command, data, cb );
        }, Math.floor( Math.random() * 100) + 10)
    }

}