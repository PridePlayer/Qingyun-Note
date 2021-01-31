var see = false,
    id = "no";
const ipc = require('electron').ipcRenderer;

ipc.send('start');
document.getElementById("date").innerText = new Date().toLocaleDateString();

function hotkey(event) {
    if (event.which == 83 && event.ctrlKey) { save(); }
    if (event.which == 80 && event.ctrlKey) { markdown(); }
    if (event.which == 77 && event.ctrlKey) { management(); }
}

function save() {
    ipc.send('save', document.getElementById("text").value, id, document.getElementById("title").value);
}

function remove() {
    if (id != "no") {
        document.getElementById("text").value = "";
        document.getElementById("title").value = "未命名笔记";
        ipc.send('remove', id);
        id = "no";
    }
}

function newpage() {
    id = "no";
    document.getElementById("text").value = "";
    document.getElementById("title").value = "未命名笔记";
    document.getElementById("date").innerText = new Date().toLocaleDateString();
}

function markdown() {
    if (see == false) {
        document.getElementById("preview").innerHTML = marked(document.getElementById("text").value);
        for (let i = 0; i < document.getElementsByTagName("a").length; i++) {
            document.getElementsByTagName("a")[i].target = "_blank"
        }
        document.getElementById("preview").style.display = "";
        document.getElementById("text").style.display = "none";
        see = true;
    } else {
        document.getElementById("preview").innerHTML = "";
        document.getElementById("text").style.display = "";
        document.getElementById("preview").style.display = "none";
        see = false;
    }
}

function change(changeid) {
    ipc.send('change-note', changeid);
}

function insertAtCursor(myField, myValue) {
    if (myField.selectionStart || myField.selectionStart == '0') {
        var startPos = myField.selectionStart;
        var endPos = myField.selectionEnd;
        var restoreTop = myField.scrollTop;
        myField.value = myField.value.substring(0, startPos) + myValue + myField.value.substring(endPos, myField.value.length);
        if (restoreTop > 0) {
            myField.scrollTop = restoreTop;
        }
        myField.focus();
        myField.selectionStart = startPos + myValue.length;
        myField.selectionEnd = startPos + myValue.length;
    } else {
        myField.value += myValue;
        myField.focus();
    }
}

function getSelectText(id) {
    var t = document.getElementById(id);
    if (window.getSelection) {
        if (t.selectionStart != undefined && t.selectionEnd != undefined) {
            return t.value.substring(t.selectionStart, t.selectionEnd);
        } else {
            return "";
        }
    } else {
        return document.selection.createRange().text;
    }
}

function management() {
    const BrowserWindow = require('electron').remote.BrowserWindow;
    const path = require('path');
    const manageWindowBtn = document.getElementById('manage-window');
    let win = new BrowserWindow({
        width: 1370,
        height: 770,
        minWidth: 1366,
        minHeight: 768,
        autoHideMenuBar: true,
        icon: __dirname + "/src/icon.ico",
        webPreferences: {
            nodeIntegration: true
        }
    });
    win.on('close', function() { win = null })
    win.loadURL(__dirname + "/management.html")
    win.show()
    win.webContents.openDevTools();
}

// ipc.on

ipc.on('save-end', function(event, newid) {
    id = newid;
});

ipc.on('update-log', function(event) {
    const notification = new Notification('青韵笔记Alpha', {
        body: '全新功能已经上线，按下Ctrl + M开始体验。'
    });

    // myNotification.onclick = () => {}
});

ipc.on('note-change', function(event, title, data, newid, date) {
    id = newid;
    if (see == false) {} else {
        markdown();
    }
    document.getElementById("text").value = data;
    document.getElementById("title").value = title;
    document.getElementById("date").innerText = date;
});

ipc.on('update-list', function(event, info) {
    document.getElementById("memu-list").innerHTML = "";
    for (let i = 0; i < info.list.length; i++) {
        document.getElementById("memu-list").innerHTML += `<div class="memu-list" id="list${info.list[i].id}" onclick="change('${info.list[i].id}')">
        <hr style="opacity: 0;"><h3 style="margin-left: 15px;margin-bottom: 0px;margin-top: 0px;color: rgb(167,167,167);">${info.list[i].title}</h3>
        <h4 style="margin-left: 15px;margin-top: 5px;margin-bottom: 0px;font-weight: normal;color: rgb(186,186,186);">${info.list[i].date}</h4>
        <hr style="opacity: 0;">
        </div>`
    }
});