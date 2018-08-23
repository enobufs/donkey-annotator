'use strict';

const Server = require('./lib/server').Server;

exports.createServer = function (folder, options) {
    return new Server(folder, options || {});
};
