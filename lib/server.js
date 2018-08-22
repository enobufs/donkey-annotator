'use strict';

const path = require('path');
const express = require('express');
const util = require('util');
const tool = require('./tool');

class Server {
    constructor(folder) {
        this._public = path.resolve(__dirname, '../public');
        this._folder = folder;
        this._app = express();
        this._port = 3000;

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
        this._srv = this._app.listen(this._port, () => {
            console.log(`Server URL   : http://localhost:${this._port}`);
            console.log(`Data Folder  : ${this._folder}`);
        });
    }

    close() {
        this._srv.close();
    }
}


const srv = new Server('./test/data2');
srv.listen();

