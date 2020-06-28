module.exports = {

    ALPHA_CONCURRENCY: 4,

    NODE_ID_LENGTH: 20, //20 bytes, 160 bits
    BUCKETS_COUNT_B: 160, //160 bits B

    BUCKET_COUNT_K: 30, //Number of nodes in a bucket

    T_BUCKETS_REFRESH: 3600000,
    T_STORE_KEY_EXPIRY: 3600000,
    T_STORE_GARBAGE_COLLECTOR: 100,

}