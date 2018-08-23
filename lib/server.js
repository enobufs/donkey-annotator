'use strict';

const path = require('path');
const express = require('express');
const util = require('util');
const tool = require('./tool');
const _ = require('lodash');
const { version } = require('../package');

const defaultOptions = {
    port: 3000,
    frameInterval: 50
};

class Server {
    constructor(folder, options) {
        this._opts = _.defaults(options, defaultOptions);
        this._public = path.resolve(__dirname, '../public');
        this._folder = folder;
        this._app = express();

        this._app.get('/login', (req, res) => {
            res.json({
                serverVersion: version,
                frameInterval: this._opts.frameInterval
            });
        });

        this._app.get('/records', (req, res) => {
            tool.listRecords(this._folder)
            .then((records) => {
                res.json(records);
            });
        });

        this._app.get('/image/:fileName', (req, res) => {
            const fileName = req.params.fileName;
            // TODO: validate the fileName
            tool.loadImage(`${this._folder}/${fileName}`)
            .catch((err) => {
                res.status(500).send(err.message);
            })
            .then((dataUrl) => {
                res.send(dataUrl);
            })
        });

        this._app.use(express.static(this._public, {
            dotfiles: 'ignore',
            etag: false,
            extensions: ['htm', 'html'],
            index: 'index.html',
            maxAge: '1d',
            redirect: false,
            setHeaders: function (res, path, stat) {
                res.set('x-timestamp', Date.now())
            }
        }))
    }

    listen() {
        this._srv = this._app.listen(this._opts.port, () => {
            console.log(`Tub folder    : ${this._folder}`);
            console.log(`Server URL    : http://localhost:${this._opts.port}`);
            console.log(`Frame interval: ${this._opts.frameInterval}`);
        });
    }

    close() {
        this._srv.close();
    }
}

exports.Server = Server;


//const srv = new Server('./test/data2');
//srv.listen();

