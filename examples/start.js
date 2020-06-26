const KAD = require('./../index');

KAD.init({});

const store = new KAD.StoreMemory();

//addresses
const contacts = [
    new KAD.Contact( '127.0.0.1', 8000, Buffer.from('188d2ad1ce11d8415bce465726e9ab3f776b2d2d', 'hex')),
    new KAD.Contact( '127.0.0.2', 8001, Buffer.from('bcd21f3ff1248430e52984940884f03c47922624', 'hex')),
    new KAD.Contact( '127.0.0.3', 8002, Buffer.from('e4f39051aa48aafab44edaee521a19f1c0c34455', 'hex')),
    new KAD.Contact( '127.0.0.4', 8003, Buffer.from('a14c02004daca7dd2f43ecade3bfefbe47d9b8b5', 'hex')),
    new KAD.Contact( '127.0.0.5', 8004, Buffer.from('eabea99bcdca93e19889b5ee4dce399df0938086', 'hex')),
    new KAD.Contact( '127.0.0.6', 8004, Buffer.from('7413070eb4508d12076235536856913fcf880522', 'hex')),
]

//creating kad nodes
const nodes = contacts.map( contact => new KAD.KademliaNode(contact, store) )
nodes.map( it => it.start() );

//encountering
nodes[0].join( contacts[1] );
nodes[1].join( contacts[2] );
nodes[2].join( contacts[3] );
nodes[2].join( contacts[4] );
nodes[4].join( contacts[5] );

console.log("Simple KAD");

nodes[0].routingTable.getClosestToKey( contacts[2].identity )