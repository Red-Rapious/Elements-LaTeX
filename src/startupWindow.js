const { BrowserWindow, app, Menu } = require("electron");
const path = require("path");

const { STARTUP_INSPECTOR } = require("./parameters");

const createStartupWindow = () => {
    startupWindow = new BrowserWindow({
        width: 800 + (STARTUP_INSPECTOR ? 350 : 0),
        height: 500,
        resizable: false,
        frame: false,
        titleBarStyle: "customButtonsOnHover",
        icon: path.join(app.getAppPath(), "assets/logos/icon.png"),
        webPreferences: {
            nodeIntegration: true, 
            contextIsolation: false, 
            preload: path.join(app.getAppPath(), "src/startupRenderer.js"),
        },
    });

    if (STARTUP_INSPECTOR) startupWindow.webContents.openDevTools();
    startupWindow.loadFile("src/startupWindow.html");
};

module.exports = { createStartupWindow };