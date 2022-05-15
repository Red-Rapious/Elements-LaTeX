const { BrowserWindow, app } = require("electron");
require("electron-reloader")(module);

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        titleBarStyle: "hiddenInset"
    });

    mainWindow.webContents.openDevTools();
    mainWindow.loadFile("index.html");
}

app.whenReady().then(createWindow);