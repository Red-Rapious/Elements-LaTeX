const { BrowserWindow, app, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
require("electron-reloader")(module);

let mainWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1500,
        height: 1000,
        titleBarStyle: "hiddenInset",
        webPreferences: {preload: path.join(app.getAppPath(), "renderer.js")},
    });

    //mainWindow.webContents.openDevTools();
    mainWindow.loadFile("index.html");
}

app.whenReady().then(createWindow);

ipcMain.on("create-document-triggered", () => {
    dialog.showSaveDialog(mainWindow, {
        filters: [{name: "LaTeX files", extensions: ["tex"]}]
    })
    .then(({ filePath }) => {
        //console.log(filePath);
        fs.writeFile(filePath, "", (error) => {
            if (error) {
                alert(error);
            }
            else {
                mainWindow.webContents.send("document-created", filePath); 
            }
        } );
    });
});

ipcMain.on("open-document-triggered", () => {
    dialog.showOpenDialog(mainWindow, {
        properties: ["openFile"],
        filters: [{name: "LaTeX files", extensions: ["tex"]}]
    })
    .then(({ filePaths }) => {
        const filePath = filePath[0];

        fs.readFile(filePath, "utf-8", (error, content) => {
            if (error) {
                alert(error)
            }
            else {
                mainWindow.webContents.send("document-opened", { filePath, content })
            }
        })
    });
});