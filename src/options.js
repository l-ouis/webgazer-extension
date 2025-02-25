'use client';

import webgazer from './webgazer/index.mjs'

let button = document.getElementById('requestPermission');

button.onclick = async ()=>{
    navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia ||
    navigator.mediaDevices.webkitGetUserMedia ||
    navigator.mediaDevices.mozGetUserMedia;

    if (navigator.mediaDevices.getUserMedia) {
        console.log("inside if statemeng");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { width: 1280, height: 720 } });
            console.log('Camera accessed in WebGazer extension options');
            chrome.runtime.sendMessage('', {
                type: 'webGazerOptionsCameraAccessed',
                stream: stream.id
            });
        } catch (err) {
            console.error(`error: ${err.name}`);
        } 
    }
    else {
        console.log("getUserMedia not supported");
    }
};

navigator.mediaDevices.enumerateDevices()
    .then(devices => {
        devices.forEach(device => {
            console.log(`${device.kind}: ${device.label} id = ${device.deviceId}`);
        });
    })
    .catch(err => {
        console.error(`Error enumerating devices: ${err.name}`);
    });