const { app, ipcMain } = require("electron");

const { createMainWindow } = require("./mainWindow");
const { createStartupWindow } = require("./startupWindow");
const { isDevelopementEnvironement } = require("./utility");

if (isDevelopementEnvironement) {
    try {
        require("electron-reloader")(module);
    } catch {}
}

app.whenReady().then(createStartupWindow);

ipcMain.on("open-main-window", createMainWindow);
//app.whenReady().then(createMainWindow);