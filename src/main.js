const { BrowserWindow, app, ipcMain, dialog, Menu, Notification } = require("electron");
const path = require("path");
const fs = require("fs");
const settings = require("electron-settings");
const { set } = require("electron-settings");
const { get } = require("http");

const isDevelopementEnvironement = process.env.NODE_ENV === "development";

if (isDevelopementEnvironement) {
    try {
        require("electron-reloader")(module);
    } catch {}
}

let mainWindow;
let openedFilePath;
let openedFolderPath;

const handleError = (location = "undefined") => {
    new Notification({
        title: "Error",
        body: "An error occured during " + location,
    }).show();

    //alert("An error occured during " + location);
};

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        titleBarStyle: "hiddenInset",
        webPreferences: {
            nodeIntegration: true, 
            contextIsolation: false, 
            preload: path.join(app.getAppPath(), "src/renderer.js"),
        },
    });

    if (isDevelopementEnvironement) mainWindow.webContents.openDevTools();
    mainWindow.loadFile("src/index.html");

    settings.has("current-file").then( bool => {
        if (bool) {
            
            settings.get("current-file").then(value => { 
                openFile(value.data);
            });
        }
    });

    settings.has("current-folder").then( bool => {
        if (bool) {
            
            settings.get("current-folder").then(value => { 
                openFolder(value.data);
            });
        }
    });

    const menuTemplate = [
    {
        label: "File",
        submenu: [
            {
                label: "Open...",
                click: () => ipcMain.emit("open-document-triggered")
            },
            {
                label: "Create a new file",
                click: () => ipcMain.emit("open-document-triggered")
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
            { type: 'separator'},
            { role: 'quit' }
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
};

const getAllFilesFromFolder = function(dir) {
    var results = [];

    fs.readdirSync(dir).forEach(function(file) {

        file = dir+'/'+file;
        var stat = fs.statSync(file);

        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFilesFromFolder(file))
        } else results.push(file);

    });
    return results;
};

const openFile = (filePath) => {
    openedFilePath = filePath;

    fs.readFile(filePath, "utf-8", (error, content) => {
        if (error) {
            handleError("the opening of the file");
        }
        else {
            app.addRecentDocument(filePath);
            settings.set("current-file", { data: filePath });
            mainWindow.webContents.send("document-opened", { filePath, content });
        }
    });
};

const openFolder = (folderPath) => {
    openedFolderPath = folderPath;
    settings.set("current-folder", { data: folderPath });
    mainWindow.webContents.send("folder-opened", { folderPath });
};

app.on("open-file", (_, filePath) => {
    openFile(filePath);
});

app.whenReady().then(createWindow);

ipcMain.on("create-document-triggered", () => {
    dialog.showSaveDialog(mainWindow, {
        filters: [{name: "LaTeX files", extensions: ["tex"]}]
    })
    .then(({ filePath }) => {
        if (filePaths != undefined) {
            fs.writeFile(filePath, "", (error) => {
                if (error) {
                    handleError("the creation of the file")
                }
                else {
                    openedFilePath = filePath;
                    app.addRecentDocument(filePath);
                    mainWindow.webContents.send("document-created", filePath);
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
            openFile(filePath);
        }
    });
});

ipcMain.on("open-folder-triggered", () => {
    dialog.showOpenDialog(mainWindow, {
        properties: ["openDirectory", "createDirectory"],
    })
    .then(({ filePaths }) => {
        console.log(filePaths);
        if (filePaths != undefined) {
            const folderPath = filePaths[0];
            openFolder(folderPath);
        }
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