'use strict';

const Jimp = require("jimp");
const tool = require('../lib/tool');
const assert = require('assert');

const expData = [{
    name: 'record_125.json',
    seq: 125,
    data: {
        'user/throttle': 0.41239661854915005,
        timestamp: null,
        'cam/image_array': '125_cam-image_array_.jpg',
        'user/angle': 0,
        'user/mode': 'user'
    }
}, {
    name: 'record_209.json',
    seq: 209,
    data: {
        'user/throttle': 0.195898312326426,
        timestamp: null,
        'cam/image_array': '209_cam-image_array_.jpg',
        'user/angle': 0.2577288125247963,
        'user/mode': 'user'
    }
}, {
    name: 'record_270.json',
    seq: 270,
    data: {
        'user/throttle': 0.3402203436384167,
        timestamp: null,
        'cam/image_array': '270_cam-image_array_.jpg',
        'user/angle': 0.5051423688467055,
        'user/mode': 'user'
    }
}, {
    name: 'record_329.json',
    seq: 329,
    data: {
        'user/throttle': 0.3505355998413037,
        timestamp: null,
        'cam/image_array': '329_cam-image_array_.jpg',
        'user/angle': 0.16495254371776483,
        'user/mode': 'user'
    }
}, {
    name: 'record_377.json',
    seq: 377,
    data: {
        'user/throttle': 0.4845728934598834,
        timestamp: null,
        'cam/image_array': '377_cam-image_array_.jpg',
        'user/angle': 0.37113559373760185,
        'user/mode': 'user'
    }
}, {
    name: 'record_420.json',
    seq: 420,
    data: {
        'user/throttle': 0.3814813684499649,
        timestamp: null,
        'cam/image_array': '420_cam-image_array_.jpg',
        'user/angle': 0,
        'user/mode': 'user'
    }
}, {
    name: 'record_469.json',
    seq: 469,
    data: {
        'user/throttle': 0.391766106143376,
        timestamp: null,
        'cam/image_array': '469_cam-image_array_.jpg',
        'user/angle': 0,
        'user/mode': 'user'
    }
}, {
    name: 'record_517.json',
    seq: 517,
    data:
    { 'user/throttle': 0.391766106143376,
        timestamp: null,
        'cam/image_array': '517_cam-image_array_.jpg',
        'user/angle': 0.06183050019837031,
        'user/mode': 'user'
    }
}, {
    name: 'record_535.json',
    seq: 535,
    data: {
        'user/throttle': 0.14435254982146672,
        timestamp: null,
        'cam/image_array': '535_cam-image_array_.jpg',
        'user/angle': 0.7422711874752037,
        'user/mode': 'user'
    }
}, {
    name: 'record_570.json',
    seq: 570,
    data: {
        'user/throttle': 0.4330271309549242,
        timestamp: null,
        'cam/image_array': '570_cam-image_array_.jpg',
        'user/angle': 0.5773186437574389,
        'user/mode': 'user'
    }
}, {
    name: 'record_646.json',
    seq: 646,
    data: {
        'user/throttle': 0.391766106143376,
        timestamp: null,
        'cam/image_array': '646_cam-image_array_.jpg',
        'user/angle': -0.10312204351939451,
        'user/mode': 'user'
    }
}, {
    name: 'record_692.json',
    seq: 692,
    data: {
        'user/throttle': 0.3608508560441908,
        timestamp: null,
        'cam/image_array': '692_cam-image_array_.jpg',
        'user/angle': 0.08246101260414442,
        'user/mode': 'user'
    }
}, {
    name: 'record_710.json',
    seq: 710,
    data: {
        'user/throttle': 0.37116611224707785,
        timestamp: null,
        'cam/image_array': '710_cam-image_array_.jpg',
        'user/angle': 0,
        'user/mode': 'user'
    }
}, {
    name: 'record_742.json',
    seq: 742,
    data: {
        'user/throttle': 0.49488814966277045,
        timestamp: null,
        'cam/image_array': '742_cam-image_array_.jpg',
        'user/angle': 0.010284737693411055,
        'user/mode': 'user'
    }
}];

describe('tool tests', function () {
    it('listRecords', function () {
        return tool.listRecords('./test/data')
        .then((records) => {
            assert.deepEqual(records, expData);
        });
    });

    it('loadImage', function () {
        return tool.loadImage('./test/data/125_cam-image_array_.jpg')
        .then((dataUrl) => {
            const d = dataUrl.split(',');
            assert.equal(d[0], 'data:image/jpeg;base64');

            const buf = Buffer.from(d[1], 'base64');
            const startedAt = Date.now();
            return Jimp.read(buf) // Jimp is slow in reading...
            .then((image) => {
                // Size of each image must be 28 x 28.
                assert.equal(image.bitmap.width, 160);
                assert.equal(image.bitmap.height, 120);
            });
        });
    });
});
