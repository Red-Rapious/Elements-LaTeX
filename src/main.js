const { BrowserWindow, app, ipcMain, dialog, Menu, Notification, TouchBar } = require("electron");
const path = require("path");
const fs = require("fs");
const settings = require("electron-settings");
const { TouchBarLabel, TouchBarButton, TouchBarSpacer } = TouchBar;

const isDevelopementEnvironement = process.env.NODE_ENV === "development";

if (isDevelopementEnvironement) {
    try {
        require("electron-reloader")(module);
    } catch {}
}

let mainWindow;
let openedFilePath;

const getExtension = (fileName) => {
    const segments = fileName.split(".")
    const extension = segments[segments.length - 1];
    return extension;
};

const handleError = (location = "undefined") => {
    new Notification({
        title: "Error",
        body: "An error occured during " + location,
    }).show();

    //alert("An error occured during " + location);
};

const openFile = (filePath) => {
    fs.readFile(filePath, "utf-8", (error, content) => {
        if (error) {
            handleError("the opening of the file");
        }
        else {
            openedFilePath = filePath;
            app.addRecentDocument(filePath);
            settings.set("current-file", { data: filePath });
            mainWindow.webContents.send("document-opened", { filePath, content });
        }
    });
};

const openFolder = (folderPath) => {
    settings.set("current-folder", { data: folderPath });
    mainWindow.webContents.send("folder-opened", { folderPath });
};

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        titleBarStyle: "hiddenInset",
        icon: path.join(app.getAppPath(), "assets/logos/icon.png"),
        webPreferences: {
            nodeIntegration: true, 
            contextIsolation: false, 
            preload: path.join(app.getAppPath(), "src/renderer.js"),
        },
    });

    if (isDevelopementEnvironement) mainWindow.webContents.openDevTools();
    mainWindow.loadFile("src/index.html");

    settings.has("current-folder").then( bool => {
        if (bool) {
            settings.get("current-folder").then(value => { 
                openFolder(value.data);
            });
        }
    });

    settings.has("current-file").then( bool => {
        if (bool) {
            settings.get("current-file").then(value => { 
                openFile(value.data);
            });
        }
    });

    const menuTemplate = [
    {
        label: "Elements LaTeX",
        submenu : [
            { type: 'separator'},
            { role: 'quit' }
        ],
    },
    {
        label: "File",
        submenu: [
            {
                label: "Open...",
                click: () => ipcMain.emit("open-document-triggered"),
                accelerator: "Cmd+O"
            },
            {
                label: "Create a new file",
                click: () => ipcMain.emit("open-document-triggered"),
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
};

app.whenReady().then(createWindow);

app.on("open-file", (event, filePath) => {
    event.preventDefault();
    if (getExtension(filePath) == "tex") openFile(filePath);
});

app.on("open-folder", (event, folderPath) => {
    event.preventDefault();
    openFolder(folderPath);
});

ipcMain.on("create-document-triggered", () => {
    dialog.showSaveDialog(mainWindow, {
        filters: [{name: "LaTeX files", extensions: ["tex"]}]
    })
    .then(({ filePath }) => {
        if (filePath != undefined) {
            fs.writeFile(filePath, "", (error) => {
                if (error) {
                    handleError("the creation of the file")
                }
                else {
                    openedFilePath = filePath;
                    app.addRecentDocument(filePath);
                    mainWindow.webContents.send("document-created", filePath);
                    openFolder(path.dirname(filePath));
                }
            } );
        }
    });
});

ipcMain.on("open-document-triggered", () => {
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
            handleError("the update of the file");
        }
    });
});

ipcMain.on("open-given-file", (_, filePath) => {
    if (fs.existsSync(filePath)) openFile(filePath);
});