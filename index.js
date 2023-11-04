import { mouseTouchChange } from "./mouse_event.js";
import { speak } from "./voice.js";
import { wakeLockStart, wakeLockStop } from "./keep_wake.js";
import { bleSearch, bleDisconnect, sendModeEvent } from "./bluetooth.js";
import { log } from "./utils.js";
import { creatNewChart, changeSensorChart } from "./chart.js";
import { lock, positionBarCal, startPoint, unlock } from "./animation_erase.js";

mouseTouchChange();
creatNewChart();

var startButton = document.getElementById("myButton");
var modeButton = document.getElementById("bleButton");
startButton.addEventListener("click", toggleColor);
modeButton.addEventListener("click", toggleColorBle);

// 紀錄起始位置，將X移動距離和畫面X做比較，大於筏值即可解鎖
var lockScreen = document.getElementById("lock-screen");
lockScreen.addEventListener("mousedown", startPoint);
lockScreen.addEventListener("mousemove", positionBarCal, false);
lockScreen.addEventListener("mouseup", unlock);

document.getElementById("btn-lock").addEventListener("click", lock)

// 測試按鈕 
document.getElementById("btn-front").addEventListener("click", function () {
  speak("直走");
})
document.getElementById("btn-none").addEventListener("click", function () {
  speak("無搜尋到導盲磚");
})
document.getElementById("btn-left").addEventListener("click", function () {
  speak("靠左前行");
})
document.getElementById("btn-right").addEventListener("click", function () {
  speak("靠右前行");
})
document.getElementById("btn-height").addEventListener("click", function () {
  // speak("注意高低差");
  document.getElementById('a_mp3').play();
})
document.getElementById("btn-obstacle").addEventListener("click", function () {
  speak("注意障礙物");
})
document.getElementById("btn-GuideBrick").addEventListener("click", function () {
  // speak("發現導盲磚");
  document.getElementById('b_mp3').play();
})
document.getElementById("btn-Crosswalk").addEventListener("click", function () {
  speak("發現斑馬線");
})

function toggleColor() {
  if (startButton.classList.contains("btn-outline-primary")) {
    onStartButtonClick();
  } else {
    onStopButtonClick();
  }
}

function toggleColorBle() {
  if (modeButton.classList.contains("btn-outline-secondary")) {
    modeButton.classList.remove("btn-outline-secondary");
    modeButton.classList.add("btn-outline-success");
    modeButton.innerHTML = "Mode 2";
    sendModeEvent("input off");

  } else {
    modeButton.classList.remove("btn-outline-success");
    modeButton.classList.add("btn-outline-secondary");
    modeButton.innerHTML = "Mode 1";
    sendModeEvent("output off");

  }
}

async function onStartButtonClick() {
  wakeLockStart();
  startButton.classList.remove("btn-outline-primary");
  startButton.classList.add("btn-outline-danger");
  startButton.innerHTML = "STOP";
  bleSearch();
}

async function onStopButtonClick() {
  wakeLockStop();
  startButton.classList.remove("btn-outline-danger");
  startButton.classList.add("btn-outline-primary");
  startButton.innerHTML = "START";

  try {
    bleDisconnect();

  } catch (error) {
    console.error(error)
    log('Argh! ' + error);
  }
}

var select = document.getElementById('dataChart');
// 當選取選單時，設定要顯示的圖表類型
select.addEventListener('change', changeSensorChart);
