import { log } from "./utils.js"

export function csvSave(Acc, Gyro) {
    const sensordata = [Acc, Gyro];
    for (const i of sensordata) {
        let header = ['X', 'Y', 'Z'].join(",")
        let csv = i.map(row => {
            let data = row.slice(1)
            data.join(',')
            return data
        }).join('\n');
        csv = `${header}\n${csv}`

        document.querySelector("#log").innerHTML = '';
        // log(csv);
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
}
