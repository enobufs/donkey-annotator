#!/usr/bin/env node

'use strict';

const program = require('commander');
const util = require('util');
const path = require('path');
const annotator = require(path.join(__dirname, '..'));
const { version } = require(path.join(__dirname, '../package'));

function resolve(ipath) {
    return path.resolve(process.cwd(), ipath);
}
 
program
    .usage('[options]')
    .version(version, '-v, --version')
    .option('-t, --tub <path>', 'Path to a tab folder')
    .option('-p, --port <num>', 'Listening port. Defaults to 3000', parseInt)
    .option('-i, --frame-interval <msec>', 'Frame interval for playback. Defaults to 50 [msec]', parseInt)
    .parse(process.argv);

const svr = annotator.createServer(program.tub, {
    port: program.port,
    frameInterval: program.frameInterval
});

svr.listen()
