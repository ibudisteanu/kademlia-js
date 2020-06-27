const KademliaNode = require('./../kademlia-node')

module.exports = class KademliaNodeMock extends KademliaNode {

    async ping(sourceContact){
        return new Promise( resolve =>{
            super.ping( sourceContact,out => {
                resolve(out)
            })
        })
    }

    async store(sourceContact, key, value ) {
        return new Promise( resolve =>{

            super.store(sourceContact, key, value, out =>{
                resolve(out)
            })

        })
    }

    async findNode( sourceContact, key ){

        return new Promise( resolve => {
            super.findNode(sourceContact, key, out => {
                resolve(out)
            })
        })
    }

    async findValue( sourceContact, key ){
        return new Promise( resolve =>{
            super.findValue(sourceContact, key, out => {
                resolve(out)
            })
        });
    }

}