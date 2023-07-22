const inputData = [], outputData = [];
let chartType = "noneChart";
let chartData = [];
let flag = false;
let device;

var btnConnection = document.getElementById("myButton");
var btnMode = document.getElementById("bleButton");
btnConnection.addEventListener("click", toggleColor);
btnMode.addEventListener("click", toggleColorBle);

function toggleColor() {
  if (btnConnection.classList.contains("btn-outline-primary")) {
    // buttonConnection.classList.remove("btn-outline-primary");
    // buttonConnection.classList.add("btn-outline-danger");
    // buttonConnection.innerHTML = "STOP";
    onStartButtonClick();

  } else {
    // btnConnection.classList.remove("btn-outline-danger");
    // btnConnection.classList.add("btn-outline-primary");
    // btnConnection.innerHTML = "START";
    onStopButtonClick();
  }
}

function toggleColorBle() {
  if (btnMode.classList.contains("btn-outline-secondary")) {
    btnMode.classList.remove("btn-outline-secondary");
    btnMode.classList.add("btn-outline-success");
    btnMode.innerHTML = "Mode 2";
    Mode1();

  } else {
    btnMode.classList.remove("btn-outline-success");
    btnMode.classList.add("btn-outline-secondary");
    btnMode.innerHTML = "Mode 1";
    Mode2();
  }
}

function log(text) {
  let log_ele = document.querySelector("#log")
  if (log_ele.value.length > 20000)
    log_ele.value = ""
  log_ele.value += text + "\n"
}

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

function speak(text) {
  const synth = window.speechSynthesis
  const utter = new SpeechSynthesisUtterance()
  utter.text = text
  synth.speak(utter)
}

async function Mode1() {
  try {
    // 傳送訊息
    const message = "input off"; // 要傳送的UTF-8字串訊息
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

async function Mode2() {
  console.log("NONO");
  try {
    // 傳送訊息
    const message = "output off"; // 要傳送的UTF-8字串訊息
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

async function onStartButtonClick() {
  btnConnection.classList.remove("btn-outline-primary");
  btnConnection.classList.add("btn-outline-danger");
  btnConnection.innerHTML = "STOP";
  try {
    log('Requesting Bluetooth Device...');
    device = await navigator.bluetooth.requestDevice({
      // add newDD
      optionalServices: [serviceUuid, accUuid, gyroUuid, voiceUuid],
      // acceptAllDevices: true
      filters: [{name: "WhiteCane"}]
    });
    device.addEventListener('gattserverdisconnected', function () {
      speak('藍芽連接錯誤，重新連接中');
      connect();
    });
    connect();
    // log('Connecting to GATT Server...');
    // server = await device.gatt.connect();

    // log('Getting Service...');
    // service = await server.getPrimaryService(serviceUuid);

    // log('Getting Characteristic...');
    // // add new

    // // 使用 for...of 迴圈遍歷陣列中的元素，取得每個 UUID 對應的 characteristic 並啟用通知
    // for (const [index, UuidTarget] of UuidTargets.entries()) {

    //   // 使用 service.getCharacteristic() 方法來取得指定 UUID 對應的 characteristic
    //   let characteristicTarget = await service.getCharacteristic(UuidTarget);

    //   // 當 characteristic 的值發生改變時，執行 callback 函數
    //   characteristicTarget.addEventListener("characteristicvaluechanged", callback);

    //   // 啟用 characteristic 的通知功能，這樣當 characteristic 的值改變時，就會發送通知
    //   await characteristicTarget.startNotifications();

    //   flag = true
    // }
  } catch (error) {
    speak('連接錯誤，請重新連接');
    log('Argh! ' + error);
  }
}

async function onStopButtonClick() {
  flag = false
  try {
    // 停止所有 characteristic 的通知功能
    for (const [index, UuidTarget] of UuidTargets.entries()) {
      const characteristicTarget = await service.getCharacteristic(UuidTarget);
      await characteristicTarget.stopNotifications();
      characteristicTarget.removeEventListener('characteristicvaluechanged',
        callback);
    }
    speak('已斷開連接');
    await server.disconnect(); // 需要手動斷開 GATT 伺服器的連線

    log('> Notifications stopped');
    const sensordata = [Acc, Gyro];
    for (i of sensordata) {
      let header = [`${sensordata[i]}x`,`${sensordata[i]}y`, `${sensordata[i]}z`].join(",")
      let csv = i.map(row => {
        let data = row.slice(1)
        data.join(',')
        return data
      }).join('\n');
      csv = `${header}\n${csv}`

      document.querySelector("#log").innerHTML = '';
      log(csv);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // a.download = 'output.csv';
      a.download = `${i[0][0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      btnConnection.classList.remove("btn-outline-danger");
      btnConnection.classList.add("btn-outline-primary");
      btnConnection.innerHTML = "START";
    }
  } catch (error) {
    console.error(error)
    log('Argh! ' + error);
  }
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

    let X = bytes2int16([bytes[0], bytes[1]])/100
    let Y = bytes2int16([bytes[2], bytes[3]])/100
    let Z = bytes2int16([bytes[4], bytes[5]])/100

    if (event.currentTarget.uuid === accUuid) {
      document.getElementById("accX").innerHTML = X;
      document.getElementById("accY").innerHTML = Y;
      document.getElementById("accZ").innerHTML = Z;
      inputData.push(["acc", X, Y, Z]);
      if (chartType === "accChart") { chartData = [X, Y, Z] };
    }
    if (event.currentTarget.uuid === gyroUuid) {
      document.getElementById("gyroX").innerHTML = X;
      document.getElementById("gyroY").innerHTML = Y;
      document.getElementById("gyroZ").innerHTML = Z;
      outputData.push(["gyro", X, Y, Z]);
      if (chartType === "gyroChart") { chartData = [X, Y, Z] };
    }
    // log(chartData.toString());
  }
}

function bytes2int16(bytes) {
  var view = new DataView(new ArrayBuffer(2));
  view.setUint8(0, bytes[1]);
  view.setUint8(1, bytes[0]);
  return view.getInt16(0, true); // true indicates little-endian byte order
}
// function bytes2int16(high, low) {
//   return (low << 8) | high
// }
function bytes4int32(one, two, three, four) {
  return (((four << 8) | three) << 16) | ((two << 8) | one)
}

var select = document.getElementById('dataChart');
// 當選取選單時，設定要顯示的圖表類型
select.addEventListener('change', (event) => {
  chartType = event.target.value;
  myChart.data.datasets.forEach(dataset => {
    dataset.data = []
    chartData = []
  })
  dataPoints = 0
});

var ctx = document.getElementById('myChart');
var maxDataPoints = 100; // 最多顯示1000筆資料
const labels = [];
for (let i = 0; i <= maxDataPoints; i++) {
  labels.push(i.toString());
}
var myChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: labels,
    datasets: [
      {
        label: 'X',
        borderColor: 'red',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderWidth: 1,
        data: [],
        tension: 0.6,
        cubicInterpolationMode: 'cubic'
      },
      {
        label: 'Y',
        borderColor: 'green',
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
        borderWidth: 1,
        data: [],
        tension: 0.6,
        cubicInterpolationMode: 'cubic'
      },
      {
        label: 'Z',
        borderColor: 'blue',
        backgroundColor: 'rgba(0, 0, 255, 0.1)',
        borderWidth: 1,
        data: [],
        tension: 0.6,
        cubicInterpolationMode: 'cubic'
      },
    ]
  },
  options: {
    animation: false,
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true
        }
      }]
    }
  }
});

var dataPoints = 0; // 紀錄資料筆數
const intervalID = setInterval(() => {
  if (flag) {
    if (!(chartData.length == 0)) {
      // 如果已經有1000筆資料，則刪除第一筆資料
      // console.log(dataPoints);
      if (dataPoints >= maxDataPoints) {
        myChart.data.datasets.forEach(dataset => {
          dataset.data.shift(); // 刪除第一筆資料
        });
      } else {
        dataPoints++;
      }

      // 新增新的數據
      myChart.data.datasets.forEach((dataset, index) => {
        dataset.data.push(chartData[index]);
      });
    } else {
      console.log("hi");
    }
    myChart.update(); // 更新圖表
  }
}, 10);


async function connect() {
  exponentialBackoff(3 /* max retries */, 2 /* seconds delay */,
    async function toTry() {
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
     
        flag = true
      }
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
/* Utils */

// This function keeps calling "toTry" until promise resolves or has
// retried "max" number of times. First retry has a delay of "delay" seconds.
// "success" is called upon success.
async function exponentialBackoff(max, delay, toTry, success, fail) {
  try {
    const result = await toTry();
    success(result);
  } catch(error) {
    if (max === 0) {
      return fail();
    }
    time('Retrying in ' + delay + 's... (' + max + ' tries left)');
    setTimeout(function() {
      exponentialBackoff(--max, delay * 2, toTry, success, fail);
    }, delay * 1000);
  }
}

function time(text) {
  log('[' + new Date().toJSON().substring(11, 8) + '] ' + text);
}