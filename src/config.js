module.exports = {

    NODE_ID_LENGTH: 20, //20 bytes, 160 bits
    BUCKETS_COUNT: 160, //160 bits B

    BUCKET_COUNT_K: 30, //Number of nodes in a bucket

    T_BUCKET_REFRESH: 5000, //time to check the status of a node

    T_STORE_KEY_EXPIRY: 3600000,
    T_STORE_GARBAGE_COLLECTOR: 100,

}