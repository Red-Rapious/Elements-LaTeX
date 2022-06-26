const { app } = require("electron");

const { createMainWindow } = require("./mainWindow");
const { isDevelopementEnvironement } = require("./utility");

if (isDevelopementEnvironement) {
    try {
        require("electron-reloader")(module);
    } catch {}
}

app.whenReady().then(createMainWindow);