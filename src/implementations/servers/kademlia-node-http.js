const KademliaNode = require('./../../kademlia-node')
const HTTPServer = require('./http-server')

module.exports = class KademliaNodeHTTP extends KademliaNode{

    constructor(contact, store, options) {
        super(contact, store, options)
        this._server = new HTTPServer();
    }

}