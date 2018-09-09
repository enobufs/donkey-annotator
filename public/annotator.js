'use strict';

const IMG_WIDTH = 160;
const IMG_HEIGHT = 120;
const IMG_HRZ_Y = 32;
const IMG_GRD_Y = 150;
const MIN_THROTTLE = 0.38

class Annotator {
    constructor() {
        this._canvas = document.getElementById('canvasId');
        this._ctx = this._canvas.getContext("2d");
        this._ctx.lineWidth = 1;
        this._ctx.lineCap = "round";
        this._result = document.getElementById('resultId');
        this._bar = document.getElementById("progbar");
        this._btnPlay = document.getElementById("btnPlay");
        this._curAngleVal = document.getElementById("curAngleId");
        this._curThrottleVal = document.getElementById("curThrottleId");
        this._angleVal = document.getElementById("angleId");
        this._throttleVal = document.getElementById("throttleId");
        this._records = null;
        this._nImages = 0;
        this._currRec = null;
        this._currImgData = null;
        this._currImgIdx = 0;
        this._prevImgIdx = -1;
        this._carPos = { x: IMG_WIDTH / 2, y: IMG_GRD_Y };
        this._curPos = { x: IMG_WIDTH / 2, y: IMG_GRD_Y };
        this._targetPos = { x: IMG_WIDTH / 2, y: IMG_HEIGHT / 2 };
        this._playTimer = null;
    }

    start() {
        this._canvas.addEventListener('mousemove',(ev) => {
            var rect = this._canvas.getBoundingClientRect();
            this.onMouseMove({
                x: ev.clientX - rect.left,
                y: ev.clientY - rect.top
            });
        }, false);

        this._canvas.addEventListener('click', (ev) => {
            var rect = this._canvas.getBoundingClientRect();
            this.onMouseClick({
                x: ev.clientX - rect.left,
                y: ev.clientY - rect.top
            });
        }, false);

        window.addEventListener('keydown', (ev) => {
            if (ev.code == "Space") {
                this.onMouseClick(this._curPos);
            }
        }, false);

        this._bar.addEventListener('click', () => {
            const newIdx = parseInt(this._bar.value);
            if ( newIdx !== this._currImgIdx) {
                this._currImgIdx = newIdx;
                this.update();
            }
        });

        this.login()
        .then((conf) => {
            this._conf = conf;
            return this.listRecords()
        })
        .then((records) => {
            this._records = records;
            this._nImages = records.length;
            this._prevImgIdx = -1;
            this._currImgIdx = 0;

            this._bar.min = 0;
            this._bar.max = this._nImages - 1; 

            return this.update();
        });
    }

    onMouseMove(pos) {
        //console.log(`mouse moved to (${pos.x}, ${pos.y})`);
        const values = this.cartToValues(pos);
        this._angleVal.innerHTML = values.angle;
        this._throttleVal.innerHTML = values.throttle;
        this._curPos = pos;
        this.update();
    }

    onMouseClick(pos) {
        console.log(`mouse clicked @ (${pos.x}, ${pos.y})`);
        const values = this.cartToValues(pos);
        const patch = [{
            op: "replace",
            path: "/user~1angle",    // "~1"-'/' (rfc6201)
            value: values.angle
        }, {
            op: "replace",
            path: "/user~1throttle", // "~1"-'/' (rfc6201)
            value: values.throttle
        }, {
            op: "replace",
            path: "/timestamp",
            value: 123
        }];
        console.log('patch:', patch);

        // apply patch
        const rec = this._records[this._currImgIdx];

        rfc6902.applyPatch(rec.data, patch);

        const fileName = rec.name;
        this.updateRecord(fileName, patch)
        .then(() => {
            console.log('updated');
            if (this._currImgIdx + 1 >= this._nImages) {
                console.log("NO MORE DATA!");
                return;
            }
            this._currImgIdx++;

            return this.update();
        });
    }

    login() {
        return new Promise((resolve, reject) => {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
                if (this.readyState == 4){
                    if (this.status != 200) {
                        reject(new Error("failed to fetch data")); 
                        return;
                    }

                    const records = JSON.parse(this.responseText);
                    resolve(records);
                    return;
                }
            };
            xmlhttp.open("GET", "/login", true);
            xmlhttp.send();
        });
    }

    listRecords() {
        return new Promise((resolve, reject) => {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
                if (this.readyState == 4){
                    if (this.status != 200) {
                        reject(new Error("failed to fetch data")); 
                        return;
                    }

                    const records = JSON.parse(this.responseText);
                    resolve(records);
                    return;
                }
            };
            xmlhttp.open("GET", "/records", true);
            xmlhttp.send();
        });
    }

    updateRecord(fileName, patch) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", `/records/${fileName}`, true);
            xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
            xhr.onload = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status != "200") {
                        reject(new Error(`failed to update record for ${fileName}`)); 
                        return;
                    }
                    resolve();
                    return;
                }
            }
            const json = JSON.stringify(patch);
            xhr.send(json);
        });
    }

    putImageData(dataUrl) {
        return new Promise((resolve) => {
            const img = new Image;
            img.src = dataUrl
            img.onload = () => {
                this._ctx.drawImage(img, 0, 0);
                resolve();
            };
        });
    }

    update() {
        let promise;
        if (this._currImgIdx == this._prevImgIdx) {
            // Use cached data URL.
            promise = Promise.resolve(this._currImgData);
        } else {
            this.updateProgressBar();

            // Get new data URL from the server.
            this._currRec = this._records[this._currImgIdx].data;
            this.updateTarget();
            promise = this.getImage(this._currRec['cam/image_array']);
        }

        promise
        .then((dataUrl) => {
            this._currImgData = dataUrl;
            this._prevImgIdx = this._currImgIdx;
            return this.putImageData(dataUrl);
        })
        .then(() => {
            // mid vertical line 
            this._ctx.beginPath();
            this._ctx.setLineDash([2, 2])
            this._ctx.moveTo(IMG_WIDTH/2, 0);
            this._ctx.lineTo(IMG_WIDTH/2, IMG_HEIGHT);
            this._ctx.strokeStyle = '#f0f080'
            this._ctx.stroke();

            // low horizontal line 
            this._ctx.beginPath();
            this._ctx.setLineDash([2, 2])
            const ly = this.throttleToY(0.38);
            this._ctx.moveTo(0, ly);
            this._ctx.lineTo(IMG_WIDTH, ly);
            this._ctx.strokeStyle = '#00f0f0'
            this._ctx.stroke();

            // high horizontal line 
            this._ctx.beginPath();
            this._ctx.setLineDash([2, 2])
            const hy = this.throttleToY(0.50);
            this._ctx.moveTo(0, hy);
            this._ctx.lineTo(IMG_WIDTH, hy);
            this._ctx.strokeStyle = '#f0f000'
            this._ctx.stroke();

            // aux line to target
            this._ctx.beginPath();
            this._ctx.setLineDash([])
            this._ctx.moveTo(this._carPos.x, this._carPos.y);
            this._ctx.lineTo(this._curPos.x, this._curPos.y);
            this._ctx.strokeStyle = '#ffffff'
            this._ctx.stroke();

            // circle
            this._ctx.beginPath();
            this._ctx.arc(
                this._targetPos.x, this._targetPos.y, 4, 0, 2 * Math.PI, false);
            this._ctx.fillStyle = 'red';
            this._ctx.fill();
            this._ctx.lineWidth = 1;
            this._ctx.strokeStyle = '#ff0000';
            this._ctx.stroke();
        });
    }

    xToAngle(x) {
        return (x / IMG_WIDTH) - 0.5;
    }

    yToThrottle(y) {
        return 1 - (y - MIN_THROTTLE) / IMG_HEIGHT;
    }

    cartToValues(pos) {
        return {
            angle: this.xToAngle(pos.x),
            throttle: this.yToThrottle(pos.y)
        };
    }

    angleToX(angle) {
        return (IMG_WIDTH / 2) * (angle * 2 + 1);
    }

    throttleToY(throttle) {
        return IMG_HEIGHT * (1 - throttle) + MIN_THROTTLE;
    }

    valuesToCart(angle, throttle) {
        return {
            x: this.angleToX(angle),
            y: this.throttleToY(throttle)
        };
    }

    updateTarget() {
        if (!this._currRec) {
            return;
        }

        const curAngle = this._currRec['user/angle'];
        const curThrottle = this._currRec['user/throttle'];

        this._curAngleVal.innerHTML = curAngle;
        this._curThrottleVal.innerHTML = curThrottle;

        this._targetPos = this.valuesToCart(curAngle, curThrottle);
    }

    updateProgressBar() {
        const width = Math.floor((this._currImgIdx / this._nImages) * IMG_WIDTH)
        this._bar.value = this._currImgIdx;
    }

    getImage(fileName) {
        return new Promise((resolve, reject) => {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
                if (this.readyState == 4){
                    if (this.status != 200) {
                        reject(new Error("failed to fetch data")); 
                        return;
                    }

                    resolve(this.responseText);
                }
            };
            xmlhttp.open("GET", `/images/${fileName}`, true);
            xmlhttp.send();
        });
    }

    toBeginning() {
        this._currImgIdx = 0
        this.update();
    }

    back() {
        //this._result.innerHTML = "back";
        if (this._currImgIdx > 0) {
            this._currImgIdx--;
            this.update();
        }
    }

    next() {
        //this._result.innerHTML = "next";
        if (this._currImgIdx + 1 < this._nImages) {
            this._currImgIdx++;
            this.update();
        } else {
            if (this._playTimer) {
                this.togglePlay();
            }
        }
    }

    toEnd() {
        this._currImgIdx = this._nImages - 1; 
        this.update();
    }

    togglePlay() {
        if (!this._playTimer) {
            this._btnPlay.innerHTML = "Stop";
            this._playTimer = setInterval(() => {
                this.next();
            }, this._conf.frameInterval);
        } else {
            this._btnPlay.innerHTML = "Play";
            clearInterval(this._playTimer);
            this._playTimer = null;
        }
    }

    save() {
        return new Promise((resolve, reject) => {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
                if (this.readyState == 4){
                    if (this.status != 200) {
                        reject(new Error("failed to fetch data")); 
                        return;
                    }

                    const res = JSON.parse(this.responseText);
                    resolve(res);
                    return;
                }
            };
            xmlhttp.open("PUT", "/records", true);
            xmlhttp.send('{}');
        })
        .then((res) => {
            this._result.innerHTML = `Updated ${res.nUpdated} files`;
        });
    }
}

