const { ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs");
const pjson = require('../package.json');
const child_process = require("child_process");
const fixPath = require("fix-path");

const { 
    getFolderStructure, 
    getTexFileInFolder, 
    createFolderStructureHTML 
} = require("./utility");

const { AUTOSAVE_INTERVAL } = require("./parameters");

window.addEventListener("DOMContentLoaded", () => {
    fixPath();
    let texDocumentPath = "";
    let openedFolderPath = "";
    let autosaveInterval;

    /* HTML elements */
    const el = {
        documentName: document.getElementById("documentName"),
        createDocumentBtn: document.getElementById("createDocumentBtn"),
        openDocumentBtn: document.getElementById("openDocumentBtn"),
        openFolderBtn: document.getElementById("openFolderBtn"),
        fileTextarea: document.getElementById("codeInput"),
        lineCountLabel: document.getElementById("lineCountLabel"),
        elementsVersionLabel: document.getElementById("elementsVersionLabel"),
        folderTree: document.getElementById("folderTree"),
        structureTree: document.getElementById("structureTree"),
        compileCodeBtn: document.getElementById("compileCodeBtn"),
        reloadFolderBtn: document.getElementById("reloadFolderBtn"),
        sidePanelCloseBtn: document.getElementById("sidePanelCloseBtn"),
        pdfViewerCloseBtn: document.getElementById("pdfViewerCloseBtn"),
        sidePanel: document.getElementById("sidePanel"),
        pdfViewerPanel: document.getElementById("pdfViewerPanel"),
        codePdfResizer: document.getElementById("codePdfResizer"),
        sideDevelopmentResizer: document.getElementById("sideDevelopmentResizer"),
    };

    // Update the footer version label
    el.elementsVersionLabel.innerHTML = "Version " + pjson.version;

    // Initially disable the text area
    el.fileTextarea.firstChild.disabled = true;

    const updateFolderTree = (folderPath) => {
        // Update the folder tree
        htmlCode = createFolderStructureHTML(getFolderStructure(folderPath));
        el.folderTree.innerHTML = "<ul>\n" + htmlCode + "\n<ul/>";
    };

    const handleDocumentChange = (filePath, content) => {
        /* On document change, updates the side file structure tree, text area and line count */
        texDocumentPath = filePath;

        // Update the structure tree (WIP)
        el.documentName.innerHTML = path.parse(filePath).base;
        el.structureTree.innerHTML = "<ul><li><i class=\"fa fa-file\"></i> " + path.parse(filePath).base + "</li>"
        
        // Update the content of text area
        el.fileTextarea.firstChild.disabled = false;
        el.fileTextarea.value = content;
        el.fileTextarea.focus();
        
        // Update the line count
        lineCount = 1;
        lines = el.fileTextarea.value.match(/\n/g);
        if (lines != null) lineCount = lines.length + 1;
        el.lineCountLabel.innerHTML = "Lines: " + lineCount;
        
        // Manage autosave
        clearInterval(autosaveInterval);
        autosaveInterval = setInterval(saveCurrentFile, AUTOSAVE_INTERVAL);

        updatePDFPanel();
    };

    const handleFolderChange = (folderPath) => {
        /* On folder change, updates the side folder structure tree */

        updateFolderTree(folderPath);
        
        // Opens a non-specific TeX file
        if (texDocumentPath == "" || texDocumentPath.indexOf(folderPath) == -1) {
            const randomTexFile = getTexFileInFolder(folderPath)
            if (randomTexFile != "") ipcRenderer.send("open-given-file", randomTexFile);
        }
        
        openedFolderPath = folderPath;
    };

    const launchPDFLatexCommand = () => {
        const command = "cd " + path.dirname(texDocumentPath) + " && " + "pdflatex " + path.basename(texDocumentPath);
        const result = child_process.spawn(command, {shell: true});

        result.stdout.on('data', (data) => {
            //console.log(`stdout: ${data}`);
        });

        result.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        result.on('close', (code) => {
            handleFolderChange(openedFolderPath);
            updatePDFPanel();
        });

        result.on('error', (err) => {
            console.error("Command error");
        });
    };

    const updatePDFPanel = () => {
        /* Uses pdfjs to show the matching pdf file into the dedicated panel */

        const viewerEle = document.getElementById('pdfViewerPanel');

        const pdfPath = texDocumentPath.slice(0, -3) + "pdf"; // path of the matching PDF document

        fs.stat(pdfPath, function(err, stat) {
            if (err == null) {
                viewerEle.innerHTML = ""; // destroy the old instance of PDF.js (if it exists)

                // Create an iframe that points to our PDF.js viewer, and tell PDF.js to open the file that was selected from the file picker.
                const iframe = document.createElement('iframe');
                iframe.src = path.join(__dirname, `libs/pdfjs/web/viewer.html?file=${pdfPath}#pagemode=none&zoom=80`);

                // Add the iframe to our UI.
                viewerEle.appendChild(iframe);
            } else if(err.code === 'ENOENT') {
                // file doesn't exist
                viewerEle.innerHTML = "No PDF document matching the opened TEX file";//"PDF: " + pdfPath + " doesn't exist...";
            } else {
                console.log("Error during PDF opening ", err.code);
            }

        });
    };

    const saveCurrentFile = () => {
        if (! el.fileTextarea.firstChild.disabled) {
            ipcRenderer.send("update-file-content", el.fileTextarea.value);

            // Delete the "modified" tag in the title bar
            el.documentName.innerHTML = path.parse(texDocumentPath).base;
        }
    };

    el.createDocumentBtn.addEventListener("click", () => {
        saveCurrentFile();
        ipcRenderer.send("create-document-triggered");
    });

    el.openDocumentBtn.addEventListener("click", () => {
        saveCurrentFile();
        ipcRenderer.send("open-document-triggered");
    });

    el.openFolderBtn.addEventListener("click", () => {
        saveCurrentFile();
        ipcRenderer.send("open-folder-triggered");
    });

    el.compileCodeBtn.addEventListener("click", () => {
        saveCurrentFile();
        launchPDFLatexCommand();
    });

    const switchPanelDisplayMin = (button, minimizedPanel, resizer, otherPanel) => {
        if (button.getAttribute("state") == "open") {
            console.log("Width " + otherPanel.style.width);
            minimizedPanel.style.display = "none";
            resizer.display = "none";
            button.setAttribute("state", "closed");
            otherPanel.style.width = "100%";
        }
        else {
            minimizedPanel.style.display = "flex";
            resizer.display = "block";
            button.setAttribute("state", "open");
            otherPanel.style.width = minimizedPanel.getAttribute("saved-width");
        };
    };

    el.sidePanelCloseBtn.addEventListener("click", () => {
        switchPanelDisplayMin(el.sidePanelCloseBtn, el.sideDevelopmentResizer.previousElementSibling, el.sideDevelopmentResizer, el.sideDevelopmentResizer.nextElementSibling);
    });

    el.pdfViewerCloseBtn.addEventListener("click", () => {
        switchPanelDisplayMin(el.pdfViewerCloseBtn, el.codePdfResizer.nextElementSibling, el.codePdfResizer, el.codePdfResizer.previousElementSibling);
    });

    el.fileTextarea.addEventListener("input", () => {
        el.documentName.innerHTML = path.parse(texDocumentPath).base + " (modified)";

        lineCount = 1;
        lines = el.fileTextarea.value.match(/\n/g);
        if (lines != null) lineCount = lines.length + 1;
        el.lineCountLabel.innerHTML = "Lines: " + lineCount;
    });

    el.reloadFolderBtn.addEventListener("click", () => {
        saveCurrentFile();
        handleFolderChange(openedFolderPath);
    });

    ipcRenderer.on("save-file-triggered", (_) => {
        saveCurrentFile();
        launchPDFLatexCommand();
    });
   
    ipcRenderer.on("document-created", (_, filePath) => {
        handleDocumentChange(filePath, "");
    });

    ipcRenderer.on("document-opened", (_, {filePath, content}) => {
        handleDocumentChange(filePath, content);
    });

    ipcRenderer.on("folder-opened", (_, { folderPath }) => {
        handleFolderChange(folderPath);
    });

    ipcRenderer.on("request-compile", (_) => {
        saveCurrentFile();
        launchPDFLatexCommand();
    });

    el.folderTree.addEventListener("click", function(event){
        /* Opens a file when it's clicked on the side panel's tree */
        
        const elem = event.target;
        if(elem !== event.currentTarget)
        {
            if(elem.classList.contains("file-tex"))
            {
                ipcRenderer.send("open-given-file", elem.id);
            }
            else if(elem.classList.contains("file-pdf"))
            {
                ipcRenderer.send("open-given-file", elem.id.slice(0, -3) + "tex");
            }
        }
    });

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