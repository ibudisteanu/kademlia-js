const KademliaNode = require('./src/kademlia-node')
const Store = require('./src/store/store')
const StoreMemory = require('./src/store/store-memory')
const Config = require('./src/config')
const Contact = require('./src/contact/contact')
const ContactAddress = require('./src/contact/contact-address')

const RoutingTable = require('./src/routing-table/routing-table')

const KademliaNodeMock = require('./src/implementations/mock/kademlia-node-mock')
const KademliaNodeHTTP = require('./src/implementations/servers/kademlia-node-http')

const BufferUtils = require('./src/helpers/buffer-utils')
const StringUtils = require('./src/helpers/string-utils')
const Validation = require('./src/helpers/validation')

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
    ContactAddress,

    Store,
    StoreMemory,

    helpers:{
        BufferUtils,
        StringUtils,
        Validation,
    },

    implementations:{
        KademliaNodeMock,
        KademliaNodeHTTP,
    }

}