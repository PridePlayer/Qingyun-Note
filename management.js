const ipc = require('electron').ipcRenderer;
var year = new Array();
ipc.send('management-start');

function unique(arr) {
    return Array.from(new Set(arr))
}

ipc.on('data-list', function(event, data) {
    if (data.list != null) {
        year.push(data.list[0].date.split("/")[0]);
        for (var i = 1; i < data.list.length; i++) {
            for (var j = 0; j < year.length; j++) {
                if (year[j] != data.list[i].date.split("/")[0])
                    year.push(data.list[i].date.split("/")[0]);
            }
        }
        year = unique(year);
        year.sort(function(a, b) {
            return b - a;
        });
        for (var j = 0; j < year.length; j++) {
            document.getElementById("main").innerHTML += `<div id="${year[j]}"><h1 class="year">${year[j]}</h1></div>`;
        }
        for (var i = 0; i < data.list.length; i++) {
            for (var j = 0; j < year.length; j++) {
                if (year[j] == data.list[i].date.split("/")[0]) {
                    document.getElementById(year[j]).innerHTML += `<div class="memu-list">
                    <hr style="opacity: 0;"><h3 style="margin-left: 15px;margin-bottom: 0px;margin-top: 0px;color: rgb(167,167,167);">${data.list[i].title}</h3>
                    <h4 style="margin-left: 15px;margin-top: 5px;margin-bottom: 0px;font-weight: normal;color: rgb(186,186,186);">${data.list[i].date}</h4>
                    <hr style="opacity: 0;">
                    </div>`;
                }
            }
        }
    }
});