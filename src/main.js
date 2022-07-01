const { app, ipcMain, BrowserWindow } = require("electron");
const { createMainWindow } = require("./mainWindow");
const { createStartupWindow } = require("./startupWindow");
const { isDevelopementEnvironement } = require("./parameters");
const settings = require("electron-settings");

if (isDevelopementEnvironement) {
    try {
        require("electron-reloader")(module);
    } catch {}
}


app.on("ready", () => {
    let useStartupWindow = true;

    if (settings.hasSync("open-startup-window")) {
        useStartupWindow = settings.getSync("open-startup-window");
    }

    if (useStartupWindow) {
        ipcMain.on("open-main-window", (_, openStartupWindowCheck) => {
            settings.setSync("open-startup-window", openStartupWindowCheck);
            createMainWindow();
        });

        createStartupWindow();
    }
    else {
        createMainWindow();     
    };
});

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

ipcMain.on("return-to-startup-window", () => {
    app.relaunch();
    app.exit();
});