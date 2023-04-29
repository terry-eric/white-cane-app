var input_Characteristic, output_Characteristic;
const inputData = [], outputData = [];
let startBtn = document.querySelector('#start');
let stopBtn = document.querySelector('#stop');
let chartType = "inputChart";////
let chartData = [];
let flag = false;

startBtn.addEventListener("click", onStartButtonClick);
stopBtn.addEventListener("click", onStopButtonClick);

function log(text) {
  let log_ele = document.querySelector("#log")
  if (log_ele.value.length > 20000)
    log_ele.value = ""
  log_ele.value += text + "\n"
}

// add new
let serviceUuid = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
let inputUuid = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
let outputUuid = "d2912856-de63-11ed-b5ea-0242ac120002";

// 宣告一個包含兩個 UUID 的陣列
let UuidTargets = [inputUuid, outputUuid];
let server;
let service;

async function onStartButtonClick() {
  try {
    log('Requesting Bluetooth Device...');
    const device = await navigator.bluetooth.requestDevice({
      // add newDD
      optionalServices: [serviceUuid, inputUuid, outputUuid],
      acceptAllDevices: true
    });

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

    log('> Notifications started');
  } catch (error) {
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
    await server.disconnect(); // 需要手動斷開 GATT 伺服器的連線

    log('> Notifications stopped');
    const sensordata = [inputData, outputData];
    // const sensordata = [outputData];
    for (i of sensordata) {
      let header = ["busvoltage", "shuntvoltage", "current", "loadvoltage", "power_W"].join(",")
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
    }
  } catch (error) {
    console.log(error)
    log('Argh! ' + error);
  }
}

function callback(event) {
  // console.log(event.currentTarget)
  // console.log(event.currentTarget.uuid)
  if (event.currentTarget.uuid === inputUuid ||
    event.currentTarget.uuid === outputUuid ) {

    let value = event.currentTarget.value;
    let a = [];
    for (let i = 0; i < value.byteLength; i++) {
      a.push('0x' + ('00' + value.getUint8(i).toString(16)).slice(-2));
    }
    let bytes = a;

    let busvoltage = bytes2int16([bytes[0], bytes[1]])/1000
    let shuntvoltage = bytes2int16([bytes[2], bytes[3]])/100
    let current = bytes2int16([bytes[4], bytes[5]])/1000
    let loadvoltage = bytes2int16([bytes[6], bytes[7]])/100
    let power_W = bytes2int16([bytes[8], bytes[9]])/10

    if (event.currentTarget.uuid === inputUuid) {
      document.getElementById("inputBusvoltage").innerHTML = busvoltage;
      document.getElementById("inputShuntvoltage").innerHTML = shuntvoltage;
      document.getElementById("inputCurrent").innerHTML = current;
      document.getElementById("inputLoadvoltage").innerHTML = loadvoltage;
      document.getElementById("inputPower").innerHTML = power_W;
      inputData.push(["input", busvoltage, shuntvoltage, current, loadvoltage, power_W]);
      if (chartType === "inputChart") { chartData = [busvoltage, shuntvoltage, current, loadvoltage, power_W] };
    }
    if (event.currentTarget.uuid === outputUuid) {
      document.getElementById("outputBusvoltage").innerHTML = busvoltage;
      document.getElementById("outputShuntvoltage").innerHTML = shuntvoltage;
      document.getElementById("outputCurrent").innerHTML = current;
      document.getElementById("outputLoadvoltage").innerHTML = loadvoltage;
      document.getElementById("outputPower").innerHTML = power_W;
      outputData.push(["output", busvoltage, shuntvoltage, current, loadvoltage, power_W]);
      if (chartType === "outputChart") { chartData = [busvoltage, shuntvoltage, current, loadvoltage, power_W] };
    }
    log(chartData.toString());
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
    dataPoints = 0
  })
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
        label: 'busvoltage',
        borderColor: 'red',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderWidth: 1,
        data: [],
        tension: 0.6,
        cubicInterpolationMode: 'cubic'
      },
      {
        label: 'shuntvoltage',
        borderColor: 'green',
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
        borderWidth: 1,
        data: [],
        tension: 0.6,
        cubicInterpolationMode: 'cubic'
      },
      {
        label: 'current',
        borderColor: 'blue',
        backgroundColor: 'rgba(0, 0, 255, 0.1)',
        borderWidth: 1,
        data: [],
        tension: 0.6,
        cubicInterpolationMode: 'cubic'
      },
      {
        label: 'loadvoltage',
        borderColor: 'purple',
        backgroundColor: 'rgba(0, 0, 255, 0.1)',
        borderWidth: 1,
        data: [],
        tension: 0.6,
        cubicInterpolationMode: 'cubic'
      },
      {
        label: 'power_W',
        borderColor: 'yellow',
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
    // 如果已經有1000筆資料，則刪除第一筆資料
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
    myChart.update(); // 更新圖表
  }
  else { }
}, 50);

