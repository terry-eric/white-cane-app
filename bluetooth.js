import { speak } from "./voice.js";
import { bytes2int16, log } from "./utils.js";
import { csvSave } from "./csv_save.js";
import { startChart, chartTypeEvent, addData } from "./chart.js";
// add new
let serviceUuid = 0x181A;
// let serviceUuid = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
let accUuid = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
let gyroUuid = "d2912856-de63-11ed-b5ea-0242ac120002";
let switchUuid = "4e1c00da-57b6-4cfd-83f8-6b1e2beae05d";
let voiceUuid = "a0451b3a-f056-4ce5-bc13-0838e26b2d68";

// 宣告一個包含兩個 UUID 的陣列
let UuidTargets = [accUuid, gyroUuid, switchUuid, voiceUuid];
let server;
let service;
let device;
const Acc = [], Gyro = [];

export async function bleSearch() {
    try {
        log('Requesting Bluetooth Device...');
        device = await navigator.bluetooth.requestDevice({
            // add newDD
            optionalServices: [serviceUuid, accUuid, gyroUuid, voiceUuid],
            // acceptAllDevices: true
            filters: [{ name: "WhiteCane" }]
        });

        connectDevice();
        device.addEventListener('gattserverdisconnected', reConnect);

    } catch (error) {
        speak('連接錯誤，請重新連接');
        log('Argh! ' + error);
    }
}

export async function bleDisconnect() {
    // 停止所有 characteristic 的通知功能
    for (const [index, UuidTarget] of UuidTargets.entries()) {
        const characteristicTarget = await service.getCharacteristic(UuidTarget);
        await characteristicTarget.stopNotifications();
        characteristicTarget.removeEventListener('characteristicvaluechanged',
            callback);
    }
    device.removeEventListener('gattserverdisconnected', reConnect);
    await server.disconnect(); // 需要手動斷開 GATT 伺服器的連線
    speak('已斷開連接');
    log('> Notifications stopped');
    csvSave(Acc, Gyro);
    startChart(false);

}

async function connectDevice() {
    try {
        time('Connecting to Bluetooth Device... ');
        log('Connecting to GATT Server...');
        server = await device.gatt.connect();

        log('Getting Service...');
        service = await server.getPrimaryService(serviceUuid);

        log('Getting Characteristic...');
        // add new

        // 使用 for...of 迴圈遍歷陣列中的元素，取得每個 UUID 對應的 characteristic 並啟用通知
        for (const [index, UuidTarget] of UuidTargets.entries()) {

            // 使用 service.getCharacteristic() 方法來取得指定 UUID 對應的 characteristic
            let characteristicTarget = await service.getCharacteristic(UuidTarget);

            // 當 characteristic 的值發生改變時，執行 callback 函數
            characteristicTarget.addEventListener("characteristicvaluechanged", callback);

            // 啟用 characteristic 的通知功能，這樣當 characteristic 的值改變時，就會發送通知
            await characteristicTarget.startNotifications();
        };
        speak('成功連接');
        startChart(true);
    } catch (error) {
        console.log("連接錯誤", error);
    }
}

async function reConnect() {

    exponentialBackoff(3 /* max retries */, 2 /* seconds delay */,
        async function toTry() {

        },
        function success() {
            log('> Bluetooth Device connected. Try disconnect it now.');
            speak('成功連接');
            log('> Notifications started');
        },
        function fail() {
            time('Failed to reconnect.');

        });
}

function callback(event) {
    // console.log(event.currentTarget)
    // console.log(event.currentTarget.uuid)
    if (event.currentTarget.uuid === voiceUuid) {
        let value = event.currentTarget.value;
        let a = [];
        for (let i = 0; i < value.byteLength; i++) {
            a.push('0x' + ('00' + value.getUint8(i).toString(16)).slice(-2));
        }
        let voiceMode = parseInt(a, 16);
        if (voiceMode == 0) {
            speak("無搜尋到導盲磚");
        }
        if (voiceMode == 1) {
            speak("直走");
        }
        if (voiceMode == 2) {
            speak("靠左前行");
        }
        if (voiceMode == 3) {
            speak("靠右前行");
        }
        console.log(voiceMode);
    }

    if (event.currentTarget.uuid === accUuid ||
        event.currentTarget.uuid === gyroUuid) {

        let value = event.currentTarget.value;
        let a = [];
        for (let i = 0; i < value.byteLength; i++) {
            a.push('0x' + ('00' + value.getUint8(i).toString(16)).slice(-2));
        }
        let bytes = a;

        let X = bytes2int16([bytes[0], bytes[1]]) / 100
        let Y = bytes2int16([bytes[2], bytes[3]]) / 100
        let Z = bytes2int16([bytes[4], bytes[5]]) / 100

        if (event.currentTarget.uuid === accUuid) {
            document.getElementById("accX").innerHTML = X;
            document.getElementById("accY").innerHTML = Y;
            document.getElementById("accZ").innerHTML = Z;
            Acc.push(["acc", X, Y, Z]);
            if (chartTypeEvent() === "accChart") { addData(X, Y, Z) };
        }
        if (event.currentTarget.uuid === gyroUuid) {
            document.getElementById("gyroX").innerHTML = X;
            document.getElementById("gyroY").innerHTML = Y;
            document.getElementById("gyroZ").innerHTML = Z;
            Gyro.push(["gyro", X, Y, Z]);
            if (chartTypeEvent() === "gyroChart") { addData(X, Y, Z) };
        }
    }
}

export async function sendModeEvent(message) {
    try {
        // 傳送訊息
        console.log(message);
        const encoder = new TextEncoder(); // 文字編碼器
        const data = encoder.encode(message); // 將字串轉換為Uint8Array數據
        let characteristicBle = await service.getCharacteristic(switchUuid);
        await new Promise((resolve, reject) => {
            characteristicBle.writeValue(data)
                .then(() => {
                    console.log('訊息傳送成功');
                    resolve();
                })
                .catch((error) => {
                    console.error('Argh! ' + error);
                    reject(error);
                });
        });

    } catch (error) {
        log('Argh! ' + error);
    }

}


/* Utils */
// This function keeps calling "toTry" until promise resolves or has
// retried "max" number of times. First retry has a delay of "delay" seconds.
// "success" is called upon success.
async function exponentialBackoff(max, delay, toTry, success, fail) {
    try {
        const result = await toTry();
        success(result);
        console.log(result);
    } catch (error) {
        if (max === 0) {
            return fail();
        }
        time('Retrying in ' + delay + 's... (' + max + ' tries left)');
        setTimeout(function () {
            exponentialBackoff(--max, delay * 2, toTry, success, fail);
        }, delay * 1000);
    }
}

function time(text) {
    log('[' + new Date().toJSON().substring(11, 8) + '] ' + text);
}

