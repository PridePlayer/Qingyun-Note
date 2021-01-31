const app = require('electron').app,
    ipc = require('electron').ipcMain,
    dialog = require('electron').dialog,
    BrowserWindow = require('electron').BrowserWindow;
const fs = require('fs'),
    path = require('path');

let win;

function createWindow() {
    // 创建浏览器窗口
    win = new BrowserWindow({
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

    // 并且为你的应用加载index.html
    win.loadFile(__dirname + '/open.html');


}

// Electron会在初始化完成并且准备好创建浏览器窗口时调用这个方法
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(createWindow);

//当所有窗口都被关闭后退出
app.on('window-all-closed', () => {
    // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活。
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // 在macOS上，当单击dock图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Main Window
ipc.on('start', function(event) {
    try {
        fs.writeFileSync(path.normalize(__dirname + "/writecheck.test"), "test");
        fs.unlinkSync(path.normalize(__dirname + "/writecheck.test"));
        var data = JSON.parse(fs.readFileSync(path.normalize(__dirname + "/data/list.json")));
        if (data.first == 0) {
            data.first = 1;
            fs.writeFileSync(path.normalize(__dirname + "/data/list.json"), JSON.stringify(data));
            event.sender.send('update-log');
        }

    } catch (err) {
        error_tips("can not write and read", err);
    }

    event.sender.send('update-list', JSON.parse(fs.readFileSync(path.normalize(__dirname + "/data/list.json"))));
});

ipc.on('remove', function(event, id) {
    const options = {
        type: 'info',
        title: '信息',
        message: "您正在删除笔记,确认吗？",
        buttons: ['是', '否']
    };
    if (dialog.showMessageBoxSync(options) == 0) {
        var info = JSON.parse(fs.readFileSync(path.normalize(__dirname + "/data/list.json")));
        for (let i = 0; i < info.list.length; i++) {
            if (info.list[i].id == id) {
                fs.unlinkSync(path.normalize(info.list[i].path));
                info.list.splice(i, 1);
                fs.writeFileSync(path.normalize(__dirname + "/data/list.json"), JSON.stringify(info));
                event.sender.send('update-list', info);
            }
        }
    }
})

ipc.on('change-note', function(event, id) {
    try {
        var info = JSON.parse(fs.readFileSync(path.normalize(__dirname + "/data/list.json")));
        if (id != "no") {
            for (let i = 0; i < info.list.length; i++) {
                if (info.list[i].id == id) {
                    var data = fs.readFileSync(info.list[i].path).toString();
                    event.sender.send('note-change', info.list[i].title, data, id, info.list[i].date);
                }
            }
        } else {
            event.sender.send('note-change', "未命名笔记", "", "no");
        }
    } catch (err) {
        error_tips("unknown", err);
        var info = JSON.parse(fs.readFileSync(path.normalize(__dirname + "/data/list.json")));
        for (let i = 0; i < info.list.length; i++) {
            if (info.list[i].id == id) {
                info.list.splice(i, 1);
                fs.writeFileSync(path.normalize(__dirname + "/data/list.json"), JSON.stringify(info));
                event.sender.send('update-list', info);
            }
        }
    }
})

ipc.on('save', function(event, text, id, title) {
    var info = JSON.parse(fs.readFileSync(path.normalize(__dirname + "/data/list.json")));
    if (id == "no") {
        const options = {
            title: '保存文件',
            defaultPath: title,
            filters: [
                { name: 'Markdown文件', extensions: ['md'] }
            ]
        }
        dialog.showSaveDialog(options)
            .then(result => {
                var id = info.list.length;
                fs.writeFileSync(path.normalize(result.filePath), text);
                info.list.push({
                    "title": title,
                    "path": result.filePath,
                    "id": id,
                    "date": new Date().toLocaleDateString()
                });
                fs.writeFileSync(path.normalize(__dirname + "/data/list.json"), JSON.stringify(info));
                event.sender.send('save-end', id);
                event.sender.send('update-list', JSON.parse(fs.readFileSync(path.normalize(__dirname + "/data/list.json"))));
            }).catch(err => {
                console.log(err)
            })
    } else {
        for (let i = 0; i < info.list.length; i++) {
            if (info.list[i].id == id) {
                info.list[i].title = title;
                fs.writeFileSync(path.normalize(__dirname + "/data/list.json"), JSON.stringify(info));
                fs.writeFileSync(path.normalize(info.list[i].path), text);
                event.sender.send('update-list', JSON.parse(fs.readFileSync(path.normalize(__dirname + "/data/list.json"))));
            }
        }
    }
})

// Management Window
ipc.on('management-start', function(event) {
    var data = JSON.parse(fs.readFileSync(path.normalize(__dirname + "/data/list.json")));
    event.sender.send('data-list', data);
})


// Function

function error_tips(errcode, err) {
    dialog.showMessageBoxSync({
        type: 'error',
        title: '错误',
        message: "啊！青韵笔记遇到了错误。您可以尝试将其报告给 Cladonia Studio。\n错误代码：" + errcode + "\n原因：" + err,
        buttons: ['确定']
    });
    fs.writeFileSync(path.normalize(__dirname + "/log/" + new Date().valueOf() + ".txt"), "Something is wrong:\n" + err);
}