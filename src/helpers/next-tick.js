if (typeof window === "undefined"){
    //nodejs
    module.exports = process.nextTick;
} else {
    module.exports = setImmediate;
}
