'use strict';

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser')
const rfc6902 = require('rfc6902');
const tool = require('./tool');
const _ = require('lodash');
const { version } = require('../package');
const fs = require('fs');
const util = require('util');
const assert = require('assert');

const writeFile = util.promisify(fs.writeFile);

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
        this._dic = {};

        // parse application/x-www-form-urlencoded
        this._app.use(bodyParser.urlencoded({ extended: false }))
        // parse application/json
        this._app.use(bodyParser.json())

        this._app.get('/login', (req, res) => {
            res.json({
                serverVersion: version,
                frameInterval: this._opts.frameInterval
            });
        });

        this._app.get('/records', (req, res) => {
            tool.listRecords(this._folder)
            .then((records) => {
                // Create a dictionary with file names as keys.
                records.forEach((rec) => {
                    this._dic[rec.name] = rec;
                });

                res.json(records);
            });
        });

        this._app.put('/records', (req, res) => {
            console.log('Hit endpoint /records');
            const toSave = Object.keys(this._dic)
            .map((key) => this._dic[key])
            .filter(rec => rec.dirty);
            tool.each(toSave, (rec) => {
                const filePath = `${this._folder}/${rec.name}`;
                const json = JSON.stringify(rec.data);
                return writeFile(filePath, json, 'utf8')
                .then(() => {
                    delete rec.dirty;
                });
            })
            .then(() => {
                res.send({ nUpdated: toSave.length });
            });
        });

        this._app.put('/records/:fileName', (req, res) => {
            const fileName = req.params.fileName;
            const patch = req.body;

            assert.ok(Array.isArray(patch));

            const rec = this._dic[fileName];
            if (!rec) {
                // Express will catch this on its own.
                throw new Error(`File "${fileName}" does not exist.`);
            }
            rfc6902.applyPatch(rec.data, req.body);
            rec.dirty = true;
            res.send({ sucess: true });
        });

        this._app.get('/images/:fileName', (req, res) => {
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
            redirect: false,
            setHeaders: function (res, path, stat) {
                res.set('x-timestamp', Date.now())
                res.set('cache-control', 'no-cache')
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
        if (this._srv) {
            this._srv.close();
            this._srv = null;
        }
    }
}

exports.Server = Server;


//const srv = new Server('./test/data2');
//srv.listen();

