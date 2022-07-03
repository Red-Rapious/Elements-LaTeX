const { app, ipcMain, BrowserWindow } = require("electron");
const { createMainWindow } = require("./mainWindow/mainWindow");
const { createStartupWindow } = require("./startupWindow/startupWindow");
const { isDevelopementEnvironement } = require("./parameters");
const settings = require("electron-settings");
const contextMenu = require("electron-context-menu");

contextMenu({
    showInspectElement: isDevelopementEnvironement,
});

if (isDevelopementEnvironement) {
    try {
        require("electron-reloader")(module);
    } catch {}
}

const openMainWindow = () => {
    let previousFile = "";
    let previousFolder = "";

    if (settings.hasSync("current-file")) {
        previousFile = settings.getSync("current-file");
    }
    if (settings.hasSync("current-folder")) {
        previousFolder = settings.getSync("current-folder");
    }
    createMainWindow(previousFile, previousFolder);
};


app.on("ready", () => {
    let useStartupWindow = true;

    if (settings.hasSync("open-startup-window")) {
        useStartupWindow = settings.getSync("open-startup-window");
    }

    if (useStartupWindow) {
        ipcMain.on("open-main-window", (_, openStartupWindowCheck) => {
            settings.setSync("open-startup-window", openStartupWindowCheck);
            openMainWindow();
        });

        createStartupWindow();
    }
    else {
        openMainWindow();  
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
    settings.setSync("open-startup-window", true);
    app.relaunch();
    app.exit();
});