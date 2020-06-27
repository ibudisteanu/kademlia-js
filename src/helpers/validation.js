module.exports = {

    validateIp(ip){
        if (typeof ip !== "string" || ip.length < 5) throw "invalid IP";
    },

    validatePort(port){
        if (typeof port !== "number" || port < 1000 || port > 65535) throw "invalid port";
    },

    validateIdentity(identity){
        if (!Buffer.isBuffer(identity)) throw "Identity is not Buffer"
        if ( identity.length !== global.KAD_OPTIONS.NODE_ID_LENGTH ) throw "Identity length is invalid"
    },

    validateLookup(identity){
        if (!Buffer.isBuffer(identity)) throw "Identity is not Buffer"
        if ( identity.length !== global.KAD_OPTIONS.NODE_ID_LENGTH ) throw "Identity length is invalid"
    }

}