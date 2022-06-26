const { ipcRenderer } = require("electron");

window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("mainWindowBtn").addEventListener("click", () => {
        ipcRenderer.send("open-main-window");
        window.close();
    });
});