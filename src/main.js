const { app, ipcMain, BrowserWindow } = require("electron");
const { createMainWindow } = require("./mainWindow/mainWindow");
const { createStartupWindow } = require("./startupWindow/startupWindow");
const { isDevelopementEnvironement } = require("./parameters");
const { STARTUP_WINDOW_CLICK_TYPE, handleError } = require("./utility");
const settings = require("electron-settings");
const contextMenu = require("electron-context-menu");

if (isDevelopementEnvironement) {
    try {
        require("electron-reloader")(module);
    } catch {}
}

contextMenu({
    showInspectElement: isDevelopementEnvironement,
});

const retrievePreviousFileSettings = () =>
{
    let previousFile = "";
    let previousFolder = "";

    if (settings.hasSync("current-file")) {
        previousFile = settings.getSync("current-file");
    }
    if (settings.hasSync("current-folder")) {
        previousFolder = settings.getSync("current-folder");
    }

    return { previousFile, previousFolder };
};

const openMainWindow = () => {
    const { previousFile, previousFolder } = retrievePreviousFileSettings();
    return createMainWindow(previousFile, previousFolder);
};

const openStartupWindow = () => {
    startupWindow = createStartupWindow();
    const { previousFile, previousFolder } = retrievePreviousFileSettings();
    console.log("previousFile", previousFile, "previousFolder", previousFolder);
    startupWindow.once("ready-to-show", () => {
            startupWindow.webContents.send("disable-latest-window-button", previousFile == "" && previousFolder == "");
    });
};


app.on("ready", () => {
    let useStartupWindow = true;

    if (settings.hasSync("open-startup-window")) {
        useStartupWindow = settings.getSync("open-startup-window");
    }

    if (useStartupWindow) {
        ipcMain.on("open-main-window", (_, { openStartupWindowCheck, clickType }) => {
            settings.setSync("open-startup-window", openStartupWindowCheck);
            mainWindow = openMainWindow();

            mainWindow.once("ready-to-show", () => {
                switch (clickType) {
                    case STARTUP_WINDOW_CLICK_TYPE.OPEN_FILE:
                        ipcMain.emit("open-file-triggered");
                        break;
                    case STARTUP_WINDOW_CLICK_TYPE.OPEN_FOLDER:
                        ipcMain.emit("open-folder-triggered");
                        break;
                    case STARTUP_WINDOW_CLICK_TYPE.NONE:
                        break;
                    default:
                        handleError("the startup window click type", "the click type is not recognized");
                }
            });
        });

        openStartupWindow();
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
      openStartupWindow();
    }
});

ipcMain.on("return-to-startup-window", () => {
    settings.setSync("open-startup-window", true);
    app.relaunch();
    app.exit();
});