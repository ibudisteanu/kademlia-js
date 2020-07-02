const KademliaRules = require('../../kademlia-rules')
const uuid = require('uuid').v1;
const Contact = require('../../contact/contact')
const HTTPServer = require('./http-server')

module.exports = class KademliaRulesHTTP extends KademliaRules {

    constructor(kademliaNode, store) {
        super(kademliaNode, store);

        this._server = new HTTPServer();

    }

    start(){
        this._server.start();
    }

    stop(){
        this._server.stop();
    }

    send(destContact, command, data, cb){

        const id = uuid();
        const timestamp = Date.now();

        if ( !(destContact instanceof Contact)) return cb(new Error("Refusing to send message to invalid contact"))

        this._server._pending[id] = {
            cb,
            timestamp,
            contact: destContact,
        };

    }

}