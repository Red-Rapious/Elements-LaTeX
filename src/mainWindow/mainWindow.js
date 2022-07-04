const { BrowserWindow, app, ipcMain, dialog, Menu, TouchBar } = require("electron");
const path = require("path");
const fs = require("fs");
const settings = require("electron-settings");
const { TouchBarButton, TouchBarSpacer } = TouchBar;

const { getExtension, handleError } = require("./../utility");
const { isDevelopementEnvironement } = require("./../parameters");

let mainWindow;
let openedFilePath;

const openFile = (filePath) => {
    try {
        const content = fs.readFileSync(filePath, "utf-8");

        openedFilePath = filePath;
        mainWindow.webContents.send("file-opened", { filePath, content });
        
        app.addRecentDocument(filePath);
        settings.setSync("current-file", filePath);
    }
    catch (error) {
        handleError("the opening of the file", error);
    }
};

const openFolder = (folderPath) => {
    mainWindow.webContents.send("folder-opened", { folderPath });
    settings.setSync("current-folder", folderPath);
};

const createMainWindow = (previousFile, previousFolder) => {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        titleBarStyle: "hiddenInset",
        icon: path.join(app.getAppPath(), "assets/logos/icon.png"),
        webPreferences: {
            nodeIntegration: true, 
            contextIsolation: false, 
            preload: path.join(app.getAppPath(), "src/mainWindow/mainRenderer.js"),
        },
    });

    if (isDevelopementEnvironement) mainWindow.webContents.openDevTools();
    mainWindow.loadFile("src/mainWindow/mainWindow.html");

    mainWindow.once("ready-to-show", () => {
        if (previousFile != "") openFile(previousFile);
        if (previousFolder != "") openFolder(previousFolder);
    });

    const menuTemplate = [
    {
        label: "Elements LaTeX",
        submenu : [
            { type: 'separator'},
            {   label: "Reset settings",
                click: () => {
                    settings.unsetSync();
                },
            },
            { role: 'quit' }
        ],
    },
    {
        label: "File",
        submenu: [
            {
                label: "Open...",
                click: () => ipcMain.emit("open-file-triggered"),
                accelerator: "Cmd+O"
            },
            {
                label: "Create a new file",
                click: () => ipcMain.emit("open-file-triggered"),
                accelerator: "Cmd+N"
            },
            {
                label: "Save file",
                click: () => mainWindow.webContents.send("save-file-triggered"),
                accelerator: "Cmd+S"
            },
            { type: 'separator'},
            {
                "label":"Open Recent",
                "role":"recentdocuments",
                "submenu":[
                  {
                    "label":"Clear Recent",
                    "role":"clearrecentdocuments"
                  }
                ]
            },
            
        ]
    },
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
            { type: 'separator' },
            {
            label: 'Speech',
            submenu: [
                { role: 'startSpeaking' },
                { role: 'stopSpeaking' }
            ]},
            { role: 'delete' },
            { type: 'separator' },
            { role: 'selectAll' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          //{ role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' },
        { role: 'close' }
        ]
      },
      {
        role: 'help',
        submenu: [
          {
            label: 'Learn More',
            click: async () => {
              const { shell } = require('electron')
              await shell.openExternal('https://electronjs.org')
            }
          }
        ]
      }
    ];
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    const touchBar = new TouchBar({
        items: [
            new TouchBarSpacer({ size: 'large' }),
            new TouchBarButton({
                label: "Compile",
                click: () => {
                    mainWindow.webContents.send("request-compile");
                }
              }),
            new TouchBarSpacer({ size: 'small' }),
            new TouchBarButton({
                label: "Stop",
                enabled: false,
                click: () => {
                }
              }),
            new TouchBarSpacer({ size: 'small' }),
            new TouchBarButton({
                label: "Debug",
                enabled: false,
                click: () => {
                }
              }),
            new TouchBarSpacer({ size: 'large' }),
        ]
      });
      
    mainWindow.setTouchBar(touchBar);

    app.on("open-file", (event, filePath) => {
        event.preventDefault();
        if (getExtension(filePath) == "tex") openFile(filePath);
    });

    app.on("open-folder", (event, folderPath) => {
        event.preventDefault();
        openFolder(folderPath);
    });

    ipcMain.on("create-file-triggered", () => {
        dialog.showSaveDialog(mainWindow, {
            filters: [{name: "LaTeX files", extensions: ["tex"]}]
        })
        .then(({ filePath }) => {
            if (filePath != undefined && filePath != "") {
                fs.writeFile(filePath, "", (error) => {
                    if (error) {
                        handleError("the creation of the file", error);
                    }
                    else {
                        openedFilePath = filePath;
                        app.addRecentDocument(filePath);
                        mainWindow.webContents.send("file-created", filePath);
                        openFolder(path.dirname(filePath));
                    }
                } );
            }
        });
    });

    ipcMain.on("open-file-triggered", () => {
        dialog.showOpenDialog(mainWindow, {
            properties: ["openFile"],
            filters: [{name: "LaTeX files", extensions: ["tex"]}]
        })
        .then(({ filePaths }) => {
            if (filePaths != undefined) {
                const filePath = filePaths[0];
                openFolder(path.dirname(filePath));
                openFile(filePath);
            }
        });
    });

    ipcMain.on("open-folder-triggered", () => {
        dialog.showOpenDialog(mainWindow, {
            properties: ["openDirectory", "createDirectory"],
        })
        .then(({ filePaths }) => {
            if (filePaths != undefined) {
                const folderPath = filePaths[0];
                openFolder(folderPath);
            }
        });
    });

    ipcMain.on("update-file-content", (_, textareaContent) => {
        fs.writeFile(openedFilePath, textareaContent, (error) => {
            if (error) {
                handleError("the update of the file", error);
            }
        });
    });

    ipcMain.on("open-given-file", (_, filePath) => {
        if (fs.existsSync(filePath)) openFile(filePath);
    });

    return mainWindow;
};

module.exports = { createMainWindow };