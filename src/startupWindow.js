const { BrowserWindow, app, Menu } = require("electron");
const path = require("path");

const { isDevelopementEnvironement } = require("./utility");

const createStartupWindow = () => {
    startupWindow = new BrowserWindow({
        width: 800,
        height: 500,
        titleBarStyle: "hiddenInset",
        icon: path.join(app.getAppPath(), "assets/logos/icon.png"),
        webPreferences: {
            nodeIntegration: true, 
            contextIsolation: false, 
            preload: path.join(app.getAppPath(), "src/startupRenderer.js"),
        },
    });

    if (isDevelopementEnvironement) startupWindow.webContents.openDevTools();
    startupWindow.loadFile("src/startupWindow.html");
};

module.exports = { createStartupWindow };