const { app, ipcMain } = require("electron");

const { createMainWindow } = require("./mainWindow");
const { createStartupWindow } = require("./startupWindow");
const { isDevelopementEnvironement } = require("./utility");
const { USE_STARTUP_WINDOW } = require("./parameters");

if (isDevelopementEnvironement) {
    try {
        require("electron-reloader")(module);
    } catch {}
}

if (USE_STARTUP_WINDOW) {
    app.whenReady().then(createStartupWindow);
    ipcMain.on("open-main-window", createMainWindow);
}
else {
    app.whenReady().then(createMainWindow);
};