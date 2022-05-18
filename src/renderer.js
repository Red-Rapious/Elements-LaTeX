const { ipcRenderer } = require("electron");
const path = require("path");

window.addEventListener("DOMContentLoaded", () => {
    /* BUTTONS */

    const el = {
        documentName: document.getElementById("documentName"),
        createDocumentBtn: document.getElementById("createDocumentBtn"),
        openDocumentBtn: document.getElementById("openDocumentBtn"),
        fileTextarea: document.getElementById("codeEditorPanel"),
    };

    const handleDocumentChange = (filePath, content = "") => {
        el.documentName.innerHTML = path.parse(filePath).base;

        el.fileTextarea.removeAttribute("disabled");
        el.fileTextarea.value = content;
        el.fileTextarea.focus();
    }

    el.createDocumentBtn.addEventListener("click", () => {
        ipcRenderer.send("create-document-triggered");
    });

    el.openDocumentBtn.addEventListener("click", () => {
        ipcRenderer.send("open-document-triggered");
    });

    el.fileTextarea.addEventListener("input", (e) => {
        ipcRenderer.send("file-content-updated", e.target.value);
    });

    ipcRenderer.on("document-created", (_, filePath) => {
        handleDocumentChange(filePath);
    });

    ipcRenderer.on("document-opened", (_, {filePath, content}) => {
        handleDocumentChange(filePath, content);
    });


    /* RESIZABLE AREAS */

    // Query the element
    const codePdfresizer = document.getElementById("codePdfResizer");
    const codeEditorPanel = document.getElementById('codeEditorPanel');
    const pdfViewerPanel = document.getElementById("pdfViewerPanel");

    // The current position of mouse
    let x = 0;
    let y = 0;

    // Width of left side
    let leftWidth = 0;

    // Handle the mousedown event
    // that's triggered when user drags the resizer
    const mouseDownHandler = function (e) {
        // Get the current mouse position
        x = e.clientX;
        y = e.clientY;
        leftWidth = codeEditorPanel.getBoundingClientRect().width;

        // Attach the listeners to `document`
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    };

    // Attach the handler
    codePdfresizer.addEventListener('mousedown', mouseDownHandler);

    const mouseMoveHandler = function (e) {
        // How far the mouse has been moved
        const dx = e.clientX - x;
        const dy = e.clientY - y;

        const newLeftWidth = ((leftWidth + dx) * 100) / codePdfresizer.parentNode.getBoundingClientRect().width;
        codeEditorPanel.style.width = `${newLeftWidth}%`;

        document.body.style.cursor = 'col-resize';

        codeEditorPanel.style.userSelect = 'none';
        codeEditorPanel.style.pointerEvents = 'none';

        pdfViewerPanel.style.userSelect = 'none';
        pdfViewerPanel.style.pointerEvents = 'none';
    };

    const mouseUpHandler = function () {
        codePdfresizer.style.removeProperty('cursor');
        document.body.style.removeProperty('cursor');

        codeEditorPanel.style.removeProperty('user-select');
        codeEditorPanel.style.removeProperty('pointer-events');

        pdfViewerPanel.style.removeProperty('user-select');
        pdfViewerPanel.style.removeProperty('pointer-events');

        // Remove the handlers of `mousemove` and `mouseup`
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

});