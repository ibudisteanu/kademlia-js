const KademliaNode = require('./src/kademlia-node')
const Store = require('./src/store/store')
const StoreMemory = require('./src/store/store-memory')
const Config = require('./src/config')
const Contact = require('./src/contact/contact')
const ContactAddress = require('./src/contact/contact-address')

const RoutingTable = require('./src/routing-table/routing-table')

const PluginKademliaNodeMock = require('./src/plugins/node-mock/plugin-node-mock')
const PluginKademliaNodeHTTP = require('./src/plugins/node-http/plugin-node-http')
const PluginSortedList = require('./src/plugins/sorted-list/plugin-sorted-list')

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

    plugins: {
        PluginKademliaNodeMock,
        PluginKademliaNodeHTTP,
    },

}