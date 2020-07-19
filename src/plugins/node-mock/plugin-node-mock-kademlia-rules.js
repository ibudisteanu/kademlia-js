const MOCKUP_SEND_ERROR_FREQUENCY = 0.001;
const bencode = require('bencode');
const BufferHelper = require('../../helpers/buffer-utils')

module.exports = function (kademliaRules) {

    const _start = kademliaRules.start.bind(kademliaRules);
    kademliaRules.start = start;

    const _stop = kademliaRules.stop.bind(kademliaRules);
    kademliaRules.stop = stop;


    kademliaRules.sendSerialized = sendSerialized;

    function start() {

        _start(...arguments);

        if (!global.KAD_MOCKUP) global.KAD_MOCKUP = {};
        global.KAD_MOCKUP[this._kademliaNode.contact.address.hostname+':'+this._kademliaNode.contact.address.port] = this;

    }

    function stop(){
        _stop(...arguments);
        delete global.KAD_MOCKUP[this._kademliaNode.contact.identityHex];
    }

    function sendSerialized(destContact, command, buffer, cb){

        //fake some unreachbility
        if (!global.KAD_MOCKUP[destContact.address.hostname+':'+destContact.address.port] || Math.random() <= MOCKUP_SEND_ERROR_FREQUENCY ) {
            console.error("LOG: Message couldn't be sent", command, destContact.identityHex, destContact.address.hostname, destContact.address.port );
            return cb(new Error("Message couldn't be sent"), null);
        }

        setTimeout(()=>{
            global.KAD_MOCKUP[destContact.address.hostname+':'+destContact.address.port].receiveSerialized(  buffer, (err, out)=>{

                if (err) return cb(err);

                const decoded = this.decodeSendAnswer(destContact, command, out);
                if (!decoded) return cb(new Error('Error decoding data'));

                cb(null, decoded);
            } );
        }, Math.floor( Math.random() * 100) + 10)
    }


}