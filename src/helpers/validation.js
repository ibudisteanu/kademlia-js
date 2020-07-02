module.exports.validateProtocol = (protocol) => {
    if (protocol !== 'udp' && protocol !== 'http' && protocol !== 'https') throw "invalid protocol";
}

module.exports.validateHostname = (hostname) => {
    if (typeof hostname !== "string" || hostname.length < 5) throw "invalid Hostname";
}

module.exports.validatePort = (port) => {
    if (typeof port !== "number" || port < 1000 || port > 65535) throw "invalid port";
}

module.exports.validateIdentity = (identity, text='Identity') => {
    if (!Buffer.isBuffer(identity)) throw `${text} is not Buffer`
    if ( identity.length !== global.KAD_OPTIONS.NODE_ID_LENGTH ) throw `${text} length is invalid`
}

module.exports.validateLookup = (lookup) => module.exports.validateIdentity(lookup, 'Lookup');

module.exports.validateStoreKey = (key) => {
    if (typeof key !== "string" && key.length !== global.KAD_OPTIONS.NODE_ID_LENGTH*2 ) throw "Key is invalid";
}

module.exports.validateStoreData = (data) => {
    if (typeof data !== 'string' || data.length === 0) throw "data is invalid";
}

