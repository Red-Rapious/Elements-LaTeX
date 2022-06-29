const { ipcRenderer } = require("electron");

window.addEventListener("DOMContentLoaded", () => {
    const openMainWindow = () => {
        ipcRenderer.send("open-main-window", el.openStartupWindowCheck.checked);
        window.close();
    };

    document.getElementById("mainWindowBtn").addEventListener("click", () => {
        openMainWindow();
    });

    el = {
        openStartupWindowCheck: document.getElementById("openStartupWindowCheck"),
    };
});