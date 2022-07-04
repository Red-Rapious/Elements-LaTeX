const { ipcRenderer } = require("electron");
const pjson = require('../../package.json');
const { STARTUP_WINDOW_CLICK_TYPE } = require("./../utility");


window.addEventListener("DOMContentLoaded", () => {
    const openMainWindow = (clickType) => {
        ipcRenderer.send("open-main-window", { 
            openStartupWindowCheck: el.openStartupWindowCheck.checked, 
            clickType: clickType,
        });
        window.close();
    };

    el = {
        versionLabel: document.getElementById("versionLabel"),
        openStartupWindowCheck: document.getElementById("openStartupWindowCheck"),
        latestWindowBtn: document.getElementById("latestWindowBtn"),
        openFileBtn: document.getElementById("openFileBtn"),
        openFolderBtn: document.getElementById("openFolderBtn"),
    };

    el.latestWindowBtn.addEventListener("click", () => {
        openMainWindow(STARTUP_WINDOW_CLICK_TYPE.NONE);
    });

    el.openFileBtn.addEventListener("click", () => {
        openMainWindow(STARTUP_WINDOW_CLICK_TYPE.OPEN_FILE);
    });

    el.openFolderBtn.addEventListener("click", () => {
        openMainWindow(STARTUP_WINDOW_CLICK_TYPE.OPEN_FOLDER);
    });

    el.versionLabel.innerHTML = "Version " + pjson.version;

    ipcRenderer.on("disable-latest-window-button", (_, isDisabled) => {
        el.latestWindowBtn.disabled = isDisabled;
    });
});