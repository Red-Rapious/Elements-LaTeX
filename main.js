const { BrowserWindow, app } = require("electron")

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 900
    });

    mainWindow.loadFile("index.html");
}

app.whenReady().then(createWindow);