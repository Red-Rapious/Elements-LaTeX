const { app, ipcMain, BrowserWindow } = require("electron");

const { createMainWindow } = require("./mainWindow");
const { createStartupWindow } = require("./startupWindow");
const { USE_STARTUP_WINDOW, isDevelopementEnvironement } = require("./parameters");

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

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createStartupWindow();
    }
});