const { BrowserWindow, app, ipcMain, Menu } = require("electron");
const path = require("path");
const settings = require("electron-settings");

const { STARTUP_INSPECTOR } = require("./../parameters");

const createStartupWindow = () => {
    startupWindow = new BrowserWindow({
        width: 750 + (STARTUP_INSPECTOR ? 350 : 0),
        height: 460,
        resizable: false,
        frame: false,
        titleBarStyle: "customButtonsOnHover",
        icon: path.join(app.getAppPath(), "assets/logos/icon.png"),
        backgroundColor: '#16161e',
        webPreferences: {
            nodeIntegration: true, 
            contextIsolation: false,
            preload: path.join(app.getAppPath(), "src/startupWindow/startupRenderer.js"),
        },
    });

    const menuTemplate = [
        {
            label: "Elements LaTeX",
            submenu : [
                {   type: 'separator' },
                {   label: "Go back to startup window", 
                    click: () => { 
                        ipcMain.emit("return-to-startup-window"); 
                    } 
                },
                {   label: "Reset settings",
                    click: () => {
                        settings.unsetSync();
                    },
                },
                {   label: "Reset recent files",
                    click: () => {
                        app.clearRecentDocuments();
                    }
                },
                { type: 'separator' },
                { role: 'quit' }
            ],
        },
        /*{
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
        },*/
          {
            label: 'View',
            submenu: [
              { role: 'reload' },
              { role: 'forceReload' },
            ]
          },
          {
            label: 'Window',
            submenu: [
            { role: 'minimize' },
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
                  await shell.openExternal("https://github.com/Red-Rapious/Elements-LaTeX")
                }
              }
            ]
          }
        ];

        const menu = Menu.buildFromTemplate(menuTemplate);
        Menu.setApplicationMenu(menu);

    if (STARTUP_INSPECTOR) startupWindow.webContents.openDevTools();
    startupWindow.loadFile("src/startupWindow/startupWindow.html");

    return startupWindow;
};

module.exports = { createStartupWindow };