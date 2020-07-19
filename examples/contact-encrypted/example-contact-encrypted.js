const KAD = require('../../index');
const async = require('async');
const nacl = require('tweetnacl');

KAD.init({});

console.log("Simple Encrypted Contact KAD");

KAD.plugins.PluginKademliaNodeMock.initialize();
KAD.plugins.PluginKademliaNodeHTTP.initialize();
const protocol = KAD.ContactAddressProtocolType.CONTACT_ADDRESS_PROTOCOL_TYPE_HTTP;
const COUNT = 10;

//addresses
const contacts = [];
const keyPairs = [];

for (let i=0; i < COUNT; i++) {
    const key = nacl.box.keyPair.fromSecretKey(KAD.helpers.BufferUtils.genBuffer(32));
    keyPairs[i] = {
        publicKey: Buffer.from(key.publicKey),
        privateKey: Buffer.from(key.secretKey),
    }
}

for (let i=0; i < COUNT; i++)
    contacts[i] = [
        KAD.helpers.BufferUtils.genBuffer(global.KAD_OPTIONS.NODE_ID_LENGTH ),
        protocol,
        '127.0.0.1',
        8000+i,
        '',
        keyPairs[i].publicKey,
    ]

function newStore(){
    return new KAD.StoreMemory();
}

//creating kad nodes
const nodes = contacts.map(
    contact => new KAD.KademliaNode(
        [
            //KAD.plugins.PluginKademliaNodeMock.plugin,
            KAD.plugins.PluginKademliaNodeHTTP.plugin,
            KAD.plugins.PluginContactEncrypted.plugin,
        ],
        contact,
        newStore()
    ) )

nodes.forEach( (it, index) => it.contact.privateKey = keyPairs[index].privateKey );
nodes.forEach( it => it.start() );

//encountering
const connections = [[0,1],[0,2],[1,2],[1,4],[2,3],[2,4],[4,5]];
async.each( connections, ( connection, next) =>{
    nodes[connection[0]].bootstrap( nodes[ connection[1] ].contact, false, next );
}, (err, out)=> {

    let query = KAD.helpers.BufferUtils.genBuffer(global.KAD_OPTIONS.NODE_ID_LENGTH );
    nodes[4].crawler.iterativeFindValue( Buffer.alloc(0), query, (err, out)=>{
        console.log("iterativeFindValue", out);
    })

    let query2 = KAD.helpers.BufferUtils.genBuffer(global.KAD_OPTIONS.NODE_ID_LENGTH );
    nodes[3].crawler.iterativeStoreValue( Buffer.alloc(0), query2, 'query2', (err, out)=>{
        console.log("iterativeStoreValue", out);

        nodes[5].crawler.iterativeFindValue( Buffer.alloc(0), query2, (err, out)=>{
            console.log("iterativeFindValue2", out);
        })

    })

});

global.NODES = nodes;
