const { BrowserWindow, app } = require("electron");
const path = require("path");

const { STARTUP_INSPECTOR } = require("./../parameters");

const createStartupWindow = () => {
    startupWindow = new BrowserWindow({
        width: 750 + (STARTUP_INSPECTOR ? 350 : 0),
        height: 460,
        resizable: false,
        frame: false,
        titleBarStyle: "customButtonsOnHover",
        icon: path.join(app.getAppPath(), "assets/logos/icon.png"),
        webPreferences: {
            nodeIntegration: true, 
            contextIsolation: false,
            preload: path.join(app.getAppPath(), "src/startupWindow/startupRenderer.js"),
        },
    });

    if (STARTUP_INSPECTOR) startupWindow.webContents.openDevTools();
    startupWindow.loadFile("src/startupWindow/startupWindow.html");
};

module.exports = { createStartupWindow };