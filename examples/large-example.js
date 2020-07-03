const KAD = require('./../index');
const async = require('async');

const NodeClass = KAD.implementations.KademliaNodeHTTP;

KAD.init({});
const store = new KAD.StoreMemory();

console.log("Large KAD");

const nodesCount = 2000;
const dataCount = 100;


//addresses
const contacts = [];
for (let i=0; i < nodesCount; i++)
    contacts.push( new KAD.Contact( Buffer.from( KAD.helpers.StringUtils.genHexString(40), 'hex'), 'http', '127.0.0.1', 10000 + i, '' ),)

const files = [];
for (let i=0; i < dataCount; i++)
    files.push({
        key: KAD.helpers.StringUtils.genHexString(40),
        value: KAD.helpers.StringUtils.genHexString(40)
    })

const nodes = contacts.map( contact => new NodeClass(contact, store) )
nodes.map( it => it.start() );

const nodesList = [];

let i=3, visited = {0: true, 1: true, 2: true}, bootstrappedCount = 0;
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

        async.each( nodesList, (node, next) =>{
            node.bootstrap( contacts[0], false, (err, out) => {
                next(null, out)
                outBootstrap.push(out);
            } );
        }, (err, out)=>{

            console.log("bootstrap finished ", outBootstrap.length );

            async.each(files, (file, next)=>{
                const nodeIndex = Math.floor( Math.random() * contacts.length );
                nodes[nodeIndex].crawler.iterativeStoreValue( file.key, file.value, (err, out) => {
                    outFiles.push(out);
                    next(null, out)
                } )
            }, (err, out)=>{

                console.log("files stored", outFiles )

            })

        } );


    })
})
