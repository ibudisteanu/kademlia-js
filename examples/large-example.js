const KAD = require('./../index');
const async = require('async');

KAD.init({});
console.log("Large KAD");

const protocol = KAD.ContactAddressProtocolType.CONTACT_ADDRESS_PROTOCOL_TYPE_HTTP;

const nodesCount = 1000;
const dataCount = 100;


//addresses
const contacts = [];
for (let i=0; i < nodesCount; i++)
    contacts.push( new KAD.Contact(  KAD.helpers.StringUtils.genBuffer(global.KAD_OPTIONS.NODE_ID_LENGTH ) ,  new KAD.ContactAddress(protocol, '127.0.0.1', 10000 + i, '' )),)

const files = [];
for (let i=0; i < dataCount; i++)
    files.push({
        key: KAD.helpers.StringUtils.genBuffer(global.KAD_OPTIONS.NODE_ID_LENGTH ),
        value: KAD.helpers.StringUtils.genBuffer(global.KAD_OPTIONS.NODE_ID_LENGTH )
    })

function newStore(){
    return new KAD.StoreMemory();
}

const nodes = contacts.map( contact => new KAD.KademliaNode(contact, newStore() ) )
nodes.forEach( node => node.use( KAD.plugins.PluginKademliaNodeHTTP ) )

nodes.map( it => it.start() );

const nodesList = [];

let i=3, visited = {0: true, 1: true, 2: true};
while (i < contacts.length) {

    let index = Math.floor(Math.random() * contacts.length);
    while (visited[index])
        index = Math.floor(Math.random() * contacts.length);

    i++;

    visited[index] = true;
    nodesList.push( nodes[index] );

}

const outBootstrap = [], outFiles = [];
nodes[0].bootstrap(contacts[1], true, ()=>{

    nodes[0].bootstrap( contacts[2], true, () => {

        async.eachLimit( nodesList, 25, (node, next) =>{
            node.bootstrap( contacts[0], false, (err, out) => {
                next(null, out)
                outBootstrap.push(out);
                console.log("joined already",  outBootstrap.length);
            } );
        }, (err, out)=>{

            console.log("bootstrap finished ", outBootstrap.length );

            async.each(files, (file, next)=>{
                const nodeIndex = Math.floor( Math.random() * contacts.length );
                nodes[nodeIndex].crawler.iterativeStoreValue( Buffer.alloc(0), file.key, file.value, (err, out) => {
                    outFiles.push(out);
                    next(null, out)
                } )
            }, (err, out)=>{

                console.log("files stored", outFiles )

            })

        } );


    })
})
