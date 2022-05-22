const { ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs");

window.addEventListener("DOMContentLoaded", () => {
    let texDocumentPath = "";

    /* BUTTONS */
    const el = {
        documentName: document.getElementById("documentName"),
        createDocumentBtn: document.getElementById("createDocumentBtn"),
        openDocumentBtn: document.getElementById("openDocumentBtn"),
        fileTextarea: document.getElementById("codeEditorPanel"),
    };

    const handleDocumentChange = (filePath, content = "") => {
        texDocumentPath = filePath;
        el.documentName.innerHTML = path.parse(filePath).base;

        updatePDFPanel();

        el.fileTextarea.removeAttribute("disabled");
        el.fileTextarea.value = content;
        el.fileTextarea.focus();
    }

    const updatePDFPanel = () => {
        /* PDF HANDLING */
        const viewerEle = document.getElementById('pdfViewerPanel');
        viewerEle.innerHTML = ''; // destroy the old instance of PDF.js (if it exists)

        const pdfPath = texDocumentPath.slice(0, -4) + ".pdf"; // path of the matching PDF document

        fs.stat(pdfPath, function(err, stat) {
            if (err == null) {
                // Create an iframe that points to our PDF.js viewer, and tell PDF.js to open the file that was selected from the file picker.
                const iframe = document.createElement('iframe');
                iframe.src = path.resolve(__dirname, `../libs/pdfjs/web/viewer.html?file=${pdfPath}`);

                // Add the iframe to our UI.
                viewerEle.appendChild(iframe);
            } else if(err.code === 'ENOENT') {
                // file doesn't exist
                viewerEle.innerHTML = "No PDF document matching the opened TEX file";//"PDF: " + pdfPath + " doesn't exist...";
            } else {
                console.log("Error during PDF opening ", err.code);
            }

        });
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
    const resizer = [document.getElementById("codePdfResizer"), document.getElementById("sideDevelopmentResizer")];
    const leftSide = [document.getElementById("codeEditorPanel"), document.getElementById("sidePanel")];
    const rightSide = [document.getElementById("pdfViewerPanel"), document.getElementById("devAndFooterContainer")];

    // Store the functions that might need to be removed later
    let mouseUpFuncs = [];
    let mouseMoveFuncs = [];

    for (var i = 0 ; i < resizer.length ; i++) {
        const id = i;
        mouseMoveFuncs.push((e) => { mouseMoveHandler(e, id); });
        mouseUpFuncs.push(() => { mouseUpHandler(id); });
    }
    
    // The current position of mouse
    let x = 0;
    let y = 0;

    // Width of left side
    let leftWidth = [0, 0];

    // Handle the mousedown event
    // that's triggered when user drags the resizer
    const mouseDownHandler = function (e, id) {
        // Get the current mouse position
        x = e.clientX;
        y = e.clientY;
        leftWidth[id] = leftSide[id].getBoundingClientRect().width;

        // Attach the listeners to `document`
        document.addEventListener('mousemove', mouseMoveFuncs[id]);
        document.addEventListener('mouseup', mouseUpFuncs[id]);
    };

    const mouseMoveHandler = function (e, id) {
        // How far the mouse has been moved
        const dx = e.clientX - x;
        const dy = e.clientY - y;

        const parentWidth = resizer[id].parentNode.getBoundingClientRect().width;
        const newLeftWidth = ((leftWidth[id] + dx) * 100) / parentWidth;
        const newRightWidth =  ((parentWidth - leftWidth[id] - dx) * 100) / parentWidth;

        leftSide[id].style.width = `${newLeftWidth}%`;
        rightSide[id].style.width = `${newRightWidth}%`;

        // TODO: ADAPT RIGHT SIDE ALSO

        document.body.style.cursor = 'col-resize';

        leftSide[id].style.userSelect = 'none';
        leftSide[id].style.pointerEvents = 'none';

        rightSide[id].style.userSelect = 'none';
        rightSide[id].style.pointerEvents = 'none';
    };

    const mouseUpHandler = function (id) {
        resizer[id].style.removeProperty('cursor');
        document.body.style.removeProperty('cursor');

        leftSide[id].style.removeProperty('user-select');
        leftSide[id].style.removeProperty('pointer-events');

        rightSide[id].style.removeProperty('user-select');
        rightSide[id].style.removeProperty('pointer-events');

        // Remove the handlers of `mousemove` and `mouseup`
        document.removeEventListener('mousemove', mouseMoveFuncs[id]);
        document.removeEventListener('mouseup', mouseUpFuncs[id]);
    };

    // Attach the handler
    for (var i = 0 ; i < resizer.length ; i++) {
        const id = i;
        resizer[id].addEventListener('mousedown', (e) => { mouseDownHandler(e, id); });
    }
});