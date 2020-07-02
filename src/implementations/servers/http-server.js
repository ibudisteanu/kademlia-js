const http = require('http');
const https = require('https');
const EventEmitter = require('events');

module.exports = class HTTPServer extends EventEmitter {

    constructor() {
        super();

        this._pending = {};
        this.server = this._createServer(this._options);
        this.server.on('error', (err) => this.emit('error', err));
    }

    start(){

    }

    stop(){

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
    _timeoutPending(cb) {
        const now = Date.now();

        for (const key in this._pending)
            if (now >= this._pending[key].timestamp + global.KAD_OPTIONS.T_RESPONSE_TIMEOUT) {
                this._pending[key].response.statusCode = 504;
                this._pending[key].response.end('Gateway Timeout');
                delete this._pending[key];
            }

        cb(null)
    }

    /**
     * Implements the writable interface
     * @private
     */
    _write([id, buffer, target], encoding, callback) {
        let [, contact] = target;

        // NB: If responding to a received request...
        if (this._pending[id]) {
            this._pending[id].response.end(buffer);
            delete this._pending[id];
            return callback(null);
        }

        // NB: If originating an outbound request...
        const reqopts = {
            hostname: contact.hostname,
            port: contact.port,
            protocol: contact.protocol,
            method: 'POST',
            headers: {
                'x-kad-message-id': id
            }
        };

        if (typeof contact.path === 'string')
            reqopts.path = contact.path;

        const request = this._createRequest(reqopts);

        request.on('response', (response) => {
            response.on('error', (err) => this.emit('error', err));
            response.pipe(concat((buffer) => {
                if (response.statusCode >= 400) {
                    let err = new Error(buffer.toString());
                    err.dispose = id;
                    this.emit('error', err);
                } else {
                    this.push(buffer);
                }
            }));
        });

        request.on('error', (err) => {
            err.dispose = id;
            this.emit('error', err);
        });
        request.end(buffer);
        callback();
    }

    /**
     * Default request handler
     * @private
     */
    _handle(req, res) {
        req.on('error', (err) => this.emit('error', err));
        res.on('error', (err) => this.emit('error', err));

        if (!req.headers['x-kad-message-id']) {
            res.statusCode = 400;
            return res.end();
        }

        res.setHeader('X-Kad-Message-ID', req.headers['x-kad-message-id']);
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Methods', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        if (req.method === 'POST' || req.method === 'OPTIONS')
            res.statusCode = 405;

        if (req.method !== 'POST')
            return res.end();

        req.pipe(concat((buffer) => {
            this._pending[ req.headers['x-kad-message-id'] ] = {
                timestamp: Date.now(),
                response: res
            };
            this.push(buffer);
        }));
    }



    /**
     * Binds the server to the given address/port
     */
    listen() {
        this.server.listen(...arguments);
    }


}