const KAD = require('./../index');

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

nodes[0].bootstrap( contacts[1] );
nodes[0].bootstrap( contacts[2] );

let i=1, visited = {}, bootstrappedCount = 0;
while (i < contacts.length){

    let index = Math.floor( Math.random() * contacts.length );
    while ( visited[index] )
        index = Math.floor( Math.random() * contacts.length );

    i++;

    visited[index] = true;
    nodes[index].bootstrap( contacts[0], ()=>{

        bootstrappedCount+=1;
        console.log(bootstrappedCount);
        if (bootstrappedCount === contacts.length-1){
            console.log("bootstrap finished ");


            let filesStored = 0;
            for (let i=0; i < files.length; i++){
                const nodeIndex = Math.floor( Math.random() * contacts.length );
                nodes[nodeIndex].crawler.iterativeStoreValue( files[i].key, files[i].value, (cb, out)=>{
                    filesStored +=1;
                    if (filesStored === files.length-1){
                        console.log("all files stored", out)
                    }

                } )
            }

        }
    } );
}
