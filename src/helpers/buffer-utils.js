const Validation = require('./validation')

module.exports = {

    /**
     * Returns the position where a xor b doesn't match
     * @param a
     * @param b
     */
    xorDistance(a, b){

        Validation.validateIdentity(a);
        Validation.validateIdentity(b);

        const length = Math.max(a.length, b.length);
        const buffer = Buffer.alloc(length);

        for (let i=0; i < length; i++)
            buffer[i] = a[i] ^ b[i];

        return buffer;
    },

    compareKeyBuffers (b1, b2) {

        Validation.validateIdentity(b1);
        Validation.validateIdentity(b2);

        for (let index = 0; index < b1.length; index++) {
            const bits = b1[index];

            if (bits !== b2[index]) {
                return bits < b2[index] ? -1 : 1;
            }
        }

        return 0;
    },

}