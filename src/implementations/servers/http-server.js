const http = require('http');
const https = require('https');
const EventEmitter = require('events');
const {setAsyncInterval, clearAsyncInterval} = require('./../../helpers/async-interval')
const uuid = require('uuid').v1;

module.exports = class HTTPServer extends EventEmitter {

    constructor(kademliaNode, onReceive ) {
        super();

        this._kademliaNode = kademliaNode;
        this._started = false;

        this.onReceive = onReceive;

        this._pending = {};
        this.server = this._createServer(this._options);
        this.server.on('error', err => this.emit('error', err));

        this.on('error',(err)=>{
            console.log(err);
        })
    }

    start(){
        if (this._started) throw new Error("HTTP Server already started");
        this.listen( this._kademliaNode.contact.port );
        this._read();
        setAsyncInterval(
            next => this._timeoutPending(next),
            global.KAD_OPTIONS.T_RESPONSE_TIMEOUT
        );

        this._started = true;
    }

    stop(){
        if (!this._started) throw new Error("HTTP Server already stopped");
        this.close();
        this._started = false;
    }

    _createServer() {
        return http.createServer();
    }

    _createRequest(options) {

        if (options.protocol === 'https')
            return https.request(...arguments);

        return http.request(...arguments);
    }

    _read() {

        if (this.server.listeners('request').length)
            return;

        this.server.on('request', this._handle.bind(this) );
    }

    /**
     * Every T_RESPONSETIMEOUT, we destroy any open sockets that are still
     * waiting
     * @private
     */
    _timeoutPending(next) {
        const now = Date.now();

        for (const key in this._pending)
            if (now >= this._pending[key].timestamp + global.KAD_OPTIONS.T_RESPONSE_TIMEOUT) {
                this._pending[key].response.statusCode = 504;
                this._pending[key].response.end('Gateway Timeout');
                delete this._pending[key];
            }

        next(null)
    }

    /**
     * Implements the writable interface
     * @private
     */
    write( id, destContact,  buffer, callback) {

        if (this._pending[id]){
            this._pending[id].response.end(buffer);
            delete this._pending[id];
            return callback(null);
        }

        // NB: If originating an outbound request...
        let protocol = '';
        if (destContact.protocol === 'http') protocol = '';
        else if (destContact.protocol === 'https') protocol = 'https:';

        const reqopts = {
            hostname: destContact.hostname,
            port: destContact.port,
            protocol: protocol,
            method: 'POST',
            headers: {
                'x-kad-id': id
            },
            encoding: 'binary',
        };

        //optional path
        if ( destContact.path) reqopts.path = destContact.path;

        const request = this._createRequest(reqopts);

        request.on('response', (response) => {

            response.on('error', (err) => {
                this.emit('error', err)
                callback(err)
            });

            const data = [];
            response.on('data', (chunk) => {
                data.push(chunk);
            }).on('end', () => {
                if (response.statusCode >= 400) {
                    const err = new Error(buffer.toString());
                    err.dispose = id;
                    return this.emit('error', err);
                }

                const bufferAnswer = Buffer.concat(data);
                callback(null, bufferAnswer);

            });

        });

        request.on('error', (err) => {
            err.dispose = id;
            this.emit('error', err);
            callback(err)
        });
        request.end(buffer);
    }

    /**
     * Default request handler
     * @private
     */
    _handle(req, res) {

        req.on('error', err => this.emit('error', err));

        const id = req.headers['x-kad-id'];
        if (!id) {
            res.statusCode = 400;
            return res.end();
        }

        res.setHeader('x-kad-id', req.headers['x-kad-id']);
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Methods', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        if (req.method !== 'POST' && req.method !== 'OPTIONS')
            res.statusCode = 405;

        if (req.method !== 'POST')
            return res.end();

        const data = [];
        req.on('data', (chunk) => {
            data.push(chunk);
        }).on('end', () => {

            const buffer = Buffer.concat(data);
            this._pending[id] = {
                timestamp: Date.now(),
                response: res
            };

            this.onReceive( buffer, (err, buffer)=>{
                delete this._pending[id];
                res.end(buffer);
            });

        });

    }



    /**
     * Binds the server to the given address/port
     */
    listen() {
        this.server.listen(...arguments);
    }

    close(){
        this.server.close(...arguments);
    }

}