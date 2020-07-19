# Kademlia DHT in JS

#### Kademlia is eazy!

Kademlia is a Distributed Hash Table.

Protocol messages
Kademlia has four messages.

`PING` — used to verify that a node is still alive.

`STORE` — Stores a (key, value) pair in one node.

`FIND_NODE` — The recipient of the request will return the k nodes in his own buckets that are the closest ones to the requested key.

`FIND_VALUE` — Same as FIND_NODE, but if the recipient of the request has the requested key in its store, it will return the corresponding value.

### Implementation
The reason it is pure JS is to make it low-latency. Promises and Async slow down the requests.


### Plugins

1. **Sorted Lists**. It allows kademlia nodes to store a Sorted List using `Red Black Tree`.
   
   This plugins extends Kademlia protocol with:
   
    `STORE_SORTED_LIST_VALUE` - Stores a (key, value, score) pair in one node.
    `FIND_SORTED_LIST` — Same as FIND_NODE, but if the recipient of the request has the requested key in its store, it will return the corresponding stored_list.

    Complexities:
   
    `Space`: O(n)
    
    `Search`: O(log N)
    
    `Delete`: O(log N)
    
    `Insert`: O(log N)
    
    `List`: O(N)
    
2. **Mock**. It is a node interface implementation for testing on the same node instance.

3. **HTTP**. It is a node interface implementation using HTTP. Pure `http` and `https` had been used. 
        
4. **Contact Encrypted**. It allows kademlia nodes to encrypt the messages exchanged between peers Elliptic Curves.

    It uses Encrypt and decrypt messages between sender and receiver using elliptic curve Diffie-Hellman key exchange. Based on Curve25519-XSalsa20-Poly1305.
    
5. **Contact Spartacus**. Well-known defense against Sybill attacks by introducing cryptographic identies using ECDSA. With Spartacus, nodes are required to prove that they own their identity by signing messages with their private EC key and including their public key in the message. The identity is thus derived from the EC public key.   
        
npm link red-black-tree-js


