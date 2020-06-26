const KademliaNode = require('./../kademlia-node')

module.exports = class KademliaNodeMock extends KademliaNode {

    async ping(){
        return new Promise( resolve =>{
            super.ping( out => {
                resolve(out)
            })
        })
    }

    async store(key, value ) {
        return new Promise( resolve =>{

            super.store(key, value, out =>{
                resolve(out)
            })

        })
    }

    async findNode( key ){

        return new Promise( resolve => {
            super.findNode(key, out => {
                resolve(out)
            })
        })
    }

    async findValue( key ){
        return new Promise( resolve =>{
            super.findValue(key, out => {
                resolve(out)
            })
        });
    }

}