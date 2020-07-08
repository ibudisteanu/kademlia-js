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

1. Sorted Lists. Allows kademlia nodes to store a Sorted List using `Red Black Tree`.
   
   This plugins extends Kademlia protocol with:
   
    `FIND_SORTED_LIST` — Same as FIND_NODE, but if the recipient of the request has the requested key in its store, it will return the corresponding value.
    