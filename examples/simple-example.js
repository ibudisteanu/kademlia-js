const KAD = require('./../index');
const async = require('async');

const NodeClass = KAD.implementations.KademliaNodeHTTP;

KAD.init({});
const store = new KAD.StoreMemory();
store.start();

console.log("Simple KAD");

//addresses
const contacts = [
    new KAD.Contact(Buffer.from('188d2ad1ce11d8415bce465726e9ab3f776b2d2d', 'hex'), 'http','127.0.0.1', 8000, '',  ),
    new KAD.Contact(Buffer.from('bcd21f3ff1248430e52984940884f03c47922624', 'hex'), 'http','127.0.0.2', 8001, '',  ),
    new KAD.Contact(Buffer.from('e4f39051aa48aafab44edaee521a19f1c0c34455', 'hex'), 'http','127.0.0.3', 8002, '', ),
    new KAD.Contact(Buffer.from('a14c02004daca7dd2f43ecade3bfefbe47d9b8b5', 'hex'), 'http','127.0.0.4', 8003, '' ),
    new KAD.Contact(Buffer.from('eabea99bcdca93e19889b5ee4dce399df0938086', 'hex'), 'http','127.0.0.5', 8004, '' ),
    new KAD.Contact(Buffer.from('7413070eb4508d12076235536856913fcf880522', 'hex'), 'http','127.0.0.6', 8005, '' ),
]

//creating kad nodes
const nodes = contacts.map( contact => new NodeClass(contact, store) )
nodes.map( it => it.start() );

//encountering
const connections = [[0,1],[0,2],[1,2],[1,4],[2,3],[2,4],[4,5]];
async.each( connections, ( connection, next) =>{
    nodes[connection[0]].bootstrap( contacts[ connection[1] ], false, next );
}, (err, out)=> {

    let query = KAD.helpers.StringUtils.genHexString(40);
    nodes[4].crawler.iterativeFindValue(query, (err, out)=>{
        console.log("iterativeFindValue", out);
    })


    let query2 = KAD.helpers.StringUtils.genHexString(40);
    nodes[3].crawler.iterativeStoreValue(query2, 'query2', (err, out)=>{
        console.log("iterativeStoreValue", out);

        nodes[5].crawler.iterativeFindValue(query2, (err, out)=>{
            console.log("iterativeFindValue2", out);
        })

    })

});
