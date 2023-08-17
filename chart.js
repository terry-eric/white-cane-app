let chartType = "noneChart";
let chartData = [];
var myChart;
let flag = false;
var ctx = document.getElementById('myChart');
var maxDataPoints = 100; // 最多顯示100筆資料
var dataPoints = 0; // 紀錄資料筆數
const labels = [];
for (let i = 0; i <= maxDataPoints; i++) {
    labels.push(i.toString());
}

export function addData(x, y, z) {
    const chartData = [x, y, z]
    if (flag) {
        if (!(chartData.length == 0)) {
            // 如果已經有100筆資料，則刪除第一筆資料
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
        }
        myChart.update(); // 更新圖表
    }
}

export function creatNewChart() {
    myChart = new Chart(ctx, {
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
                    cubicInterpolationMode: 'cubic',
                    yAxisID: 'myScale' // 將X資料集連接到myScale Y軸
                },
                {
                    label: 'Y',
                    borderColor: 'green',
                    backgroundColor: 'rgba(0, 255, 0, 0.1)',
                    borderWidth: 1,
                    data: [],
                    tension: 0.6,
                    cubicInterpolationMode: 'cubic',
                    yAxisID: 'myScale' // 將X資料集連接到myScale Y軸
                },
                {
                    label: 'Z',
                    borderColor: 'blue',
                    backgroundColor: 'rgba(0, 0, 255, 0.1)',
                    borderWidth: 1,
                    data: [],
                    tension: 0.6,
                    cubicInterpolationMode: 'cubic',
                    yAxisID: 'myScale' // 將X資料集連接到myScale Y軸
                },
            ]
        },
        options: {
            layout: {
                padding: {
                    right: 20
                },
            },
            animation: false,
            scales: {
                x: {
                    grid: {
                        color: "#ffffff",
                        tickWidth: 1,
                        tickBorderDash: [0, 1],
                        offset: true
                    },
                    ticks: {
                        color: "#ffffff",
                    },
                    title: {
                        padding: 5
                    }
                },
                myScale: {
                    position: 'left',
                    grid: {
                        color: "#ffffff",
                        tickBorderDash: [0, 1]
                    },
                    ticks: {
                        color: "#ffffff",
                    }
                }
            }
        }
    });
}


export function chartTypeEvent() {
    return chartType;
}
export function startChart(status) {
    flag = status;
}

export function changeSensorChart(event) {
    chartType = event.target.value;
    myChart.data.datasets.forEach(dataset => {
        dataset.data = []
        chartData = []
    })
    dataPoints = 0
}
