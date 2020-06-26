const KademliaNode = require('./src/kademlia-node')
const Store = require('./src/store/store')
const StoreMemory = require('./src/store/store-memory')
const Config = require('./src/config')
const Contact = require('./src/contact/contact')
const RoutingTable = require('./src/routing-table')

const KademliaNodeMock = require('./src/implementations/kademlia-node-mock')

module.exports = {

    init(config ={} ) {

        global.KAD_OPTIONS = {
            config,
            ...Config,
        };

    },

    KademliaNode,
    RoutingTable,
    Contact,

    Store,
    StoreMemory,

    implementations:{
        KademliaNodeMock,
    }

}