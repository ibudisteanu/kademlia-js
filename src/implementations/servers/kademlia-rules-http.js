const KademliaRules = require('../../kademlia-rules')
const Contact = require('../../contact/contact')
const HTTPServer = require('./http-server')
const uuid = require('uuid').v1;
module.exports = class KademliaRulesHTTP extends KademliaRules {

    constructor(kademliaNode, store) {
        super(kademliaNode, store);

        this._server = new HTTPServer(kademliaNode, this.receive.bind(this) );

    }

    start(){
        this._server.start();
    }

    stop(){
        this._server.stop();
    }

    send(destContact, command, data, cb){

        const id = uuid();

        if ( !(destContact instanceof Contact)) return cb(new Error("Refusing to send message to invalid contact"))
        this._server.write( id, destContact, command, data, cb )

    }

}