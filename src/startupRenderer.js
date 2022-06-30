const { ipcRenderer } = require("electron");
const pjson = require('../package.json');

window.addEventListener("DOMContentLoaded", () => {
    const openMainWindow = () => {
        ipcRenderer.send("open-main-window", el.openStartupWindowCheck.checked);
        window.close();
    };

    document.getElementById("mainWindowBtn").addEventListener("click", () => {
        openMainWindow();
    });

    el = {
        versionLabel: document.getElementById("versionLabel"),
        openStartupWindowCheck: document.getElementById("openStartupWindowCheck"),
    };

    el.versionLabel.innerHTML = "Version " + pjson.version;
});