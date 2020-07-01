const KAD = require('./../index');
const async = require('async');

KAD.init({});
const store = new KAD.StoreMemory();


console.log("Large KAD");

const nodesCount = 100;
const dataCount = 100;


//addresses
const contacts = [];
for (let i=0; i < nodesCount; i++)
    contacts.push( new KAD.Contact( '127.0.0.1', 8000 + i, Buffer.from( KAD.helpers.StringUtils.genHexString(40), 'hex') ),)

const files = [];
for (let i=0; i < dataCount; i++)
    files.push({
        key: KAD.helpers.StringUtils.genHexString(40),
        value: KAD.helpers.StringUtils.genHexString(40)
    })


const nodes = contacts.map( contact => new KAD.implementations.KademliaNodeMock(contact, store) )
nodes.map( it => it.start() );

const nodesList = [];


let i=1, visited = {}, bootstrappedCount = 0;
while (i < contacts.length) {

    let index = Math.floor(Math.random() * contacts.length);
    while (visited[index])
        index = Math.floor(Math.random() * contacts.length);

    i++;

    visited[index] = true;
    nodesList.push( nodes[index] );

}

nodes[0].bootstrap(contacts[1], true, ()=>{

    nodes[0].bootstrap(contacts[2], true, ()=>{

        async.each( nodesList, (node, next) =>{
            node.bootstrap( contacts[0], false, next );
        }, (err, out)=>{

            console.log("bootstrap finished ", err, out);

            async.each(files, (file, next)=>{
                const nodeIndex = Math.floor( Math.random() * contacts.length );
                nodes[nodeIndex].crawler.iterativeStoreValue( file.key, file.value, (err, out) => next() )
            }, (err, out)=>{

                console.log("files stored", out)

            })

        } );


    })
})
