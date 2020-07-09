const MOCKUP_SEND_ERROR_FREQUENCY = 0.001;

module.exports = function PluginNodeMockKademliaRules(kademliaRules) {

    const _start = kademliaRules.start.bind(kademliaRules);
    kademliaRules.start = start;

    const _stop = kademliaRules.stop.bind(kademliaRules);
    kademliaRules.stop = stop;

    const _send = kademliaRules.send.bind(kademliaRules);
    kademliaRules.send = send;

    function start() {

        _start(...arguments);

        if (!global.KAD_MOCKUP) global.KAD_MOCKUP = {};
        global.KAD_MOCKUP[this._kademliaNode.contact.address.hostname+':'+this._kademliaNode.contact.address.port] = this;

    }

    function stop(){
        _stop(...arguments);
        delete global.KAD_MOCKUP[this._kademliaNode.contact.identityHex];
    }

    function send(destContact, command, data, cb){
        //fake some unreachbility
        if (!global.KAD_MOCKUP[destContact.address.hostname+':'+destContact.address.port] || Math.random() <= MOCKUP_SEND_ERROR_FREQUENCY ) {
            console.error("LOG: Message couldn't be sent", command, destContact.identityHex, destContact.address.hostname, destContact.address.port );
            return cb(new Error("Message couldn't be sent"), null);
        }

        setTimeout(()=>{
           global.KAD_MOCKUP[destContact.address.hostname+':'+destContact.address.port].receive( this._kademliaNode.contact.clone(), command, data, cb );
        }, Math.floor( Math.random() * 100) + 10)

    }

}