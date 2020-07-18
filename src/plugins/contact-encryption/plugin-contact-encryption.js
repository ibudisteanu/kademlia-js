const PluginContactEncryptedKademliaContact = require('./plugin-contact-encrypted-kademlia-contact')

module.exports = function(kademliaNode){

    PluginContactEncryptedKademliaContact(kademliaNode);

    return {
        name: "PluginContactEncrypted",
        version: "0.1",
        success: true,
    }

}