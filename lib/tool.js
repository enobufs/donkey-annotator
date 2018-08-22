'use strict';

const testFolder = './test/data';
const fs = require('fs');
const util = require('util')

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);


function each(arr, fn) {
    // invalid input
    if(!Array.isArray(arr)) return Promise.reject(new Error("Non array passed to each"));
    // empty case
    if(arr.length === 0) return Promise.resolve(); 
    return arr.reduce(function(prev, cur) { 
        return prev.then(() => fn(cur))
    }, Promise.resolve());
}

function listRecords(folder) {
    const records = [];
    return readdir(folder)
    .then((files) => {
        const re = /^record_([0-9]+)\.json$/;
        files.forEach(fileName => {
            const result = re.exec(fileName);
            if (result) {
                records.push({
                    name: fileName,
                    seq: +result[1]
                });
            }
        });

        records.sort((lhs, rhs) => { return lhs.seq - rhs.seq; });

        return each(records, (record) => {
            return readFile(`${folder}/${record.name}`, 'utf8')
            .then((json) => {
                record.data = JSON.parse(json);
            })
        })
        .then(() => {
            return records;
        });
    });
}

function loadImage(imagePath) {
    console.log('loading image at %s', imagePath);
    return readFile(imagePath)
    .then((buf) => {
        return `data:image/jpeg;base64,${buf.toString('base64')}`
    });
}

exports.each = each;
exports.listRecords = listRecords;
exports.loadImage = loadImage;
