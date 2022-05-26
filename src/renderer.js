const { ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs");

var _getAllFilesFromFolder = function(dir) {
    var results = [];

    filesystem.readdirSync(dir).forEach(function(file) {

        file = dir+'/'+file;
        var stat = filesystem.statSync(file);

        if (stat && stat.isDirectory()) {
            results = results.concat(_getAllFilesFromFolder(file))
        } else results.push(file);

    });

    return results;
};

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
                iframe.src = path.resolve(__dirname, `../libs/pdfjs/web/viewer.html?file=${pdfPath}#pagemode=none&zoom=110`);

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

    const minWidth = 15;
    const minHeight = 15;
    /* RESIZABLE AREAS */
    const resizable = function (resizer) {
        const direction = resizer.getAttribute('data-direction') || 'horizontal';
        const prevSibling = resizer.previousElementSibling;
        const nextSibling = resizer.nextElementSibling;

        // The current position of mouse
        let x = 0;
        let y = 0;
        let prevSiblingHeight = 0;
        let prevSiblingWidth = 0;

        // Handle the mousedown event
        // that's triggered when user drags the resizer
        const mouseDownHandler = function (e) {
            // Get the current mouse position
            x = e.clientX;
            y = e.clientY;
            const rect = prevSibling.getBoundingClientRect();
            prevSiblingHeight = rect.height;
            prevSiblingWidth = rect.width;

            // Attach the listeners to `document`
            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
        };

        const mouseMoveHandler = function (e) {
            // How far the mouse has been moved
            const dx = e.clientX - x;
            const dy = e.clientY - y;

            switch (direction) {
                case 'vertical':
                    const h =
                        ((prevSiblingHeight + dy) * 100) /
                        resizer.parentNode.getBoundingClientRect().height;
                    prevSibling.style.height = `${h}%`;
                    break;
                case 'horizontal':
                default:
                    const w =
                        ((prevSiblingWidth + dx) * 100) / resizer.parentNode.getBoundingClientRect().width;
                    prevSibling.style.width = `${w}%`;
                    break;
            }

            const cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
            resizer.style.cursor = cursor;
            document.body.style.cursor = cursor;

            prevSibling.style.userSelect = 'none';
            prevSibling.style.pointerEvents = 'none';

            nextSibling.style.userSelect = 'none';
            nextSibling.style.pointerEvents = 'none';
        };

        const mouseUpHandler = function () {
            resizer.style.removeProperty('cursor');
            document.body.style.removeProperty('cursor');

            prevSibling.style.removeProperty('user-select');
            prevSibling.style.removeProperty('pointer-events');

            nextSibling.style.removeProperty('user-select');
            nextSibling.style.removeProperty('pointer-events');

            // Remove the handlers of `mousemove` and `mouseup`
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        };

        // Attach the handler
        resizer.addEventListener('mousedown', mouseDownHandler);
    };

    // Query all resizers
    document.querySelectorAll('.resizer').forEach(function (ele) {
        resizable(ele);
    });

});