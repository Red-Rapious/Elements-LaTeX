const { BrowserWindow, app, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
require("electron-reloader")(module);

let mainWindow;
let openedFilePath;

const handleError = (location = "undefined") => {
    /*new Notification({
        title: "Error",
        body: "An error occured during " + location,
    }).show();*/

    alert("An error occured during " + location);
};

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1500,
        height: 1000,
        titleBarStyle: "hiddenInset",
        webPreferences: {preload: path.join(app.getAppPath(), "renderer.js")},
    });

    //mainWindow.webContents.openDevTools();
    mainWindow.loadFile("index.html");
};

app.whenReady().then(createWindow);

ipcMain.on("create-document-triggered", () => {
    dialog.showSaveDialog(mainWindow, {
        filters: [{name: "LaTeX files", extensions: ["tex"]}]
    })
    .then(({ filePath }) => {
        //console.log(filePath);
        fs.writeFile(filePath, "", (error) => {
            if (error) {
                handleError("the creation of the file")
            }
            else {
                openedFilePath = filePath;
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
        openedFilePath = filePath;

        fs.readFile(filePath, "utf-8", (error, content) => {
            if (error) {
                handleError("the opening of the file");
            }
            else {
                mainWindow.webContents.send("document-opened", { filePath, content })
            }
        })
    });
});

// Note: this method of updating file at every keyboard input is pretty inefficient
// TODO: change it later
ipcMain.on("file-content-updated", (_, textareaContent) => {
    fs.writeFile(openedFilePath, textareaContent, (error) => {
        if (error) {
            handleError("the update of the file");
        }
    });
});