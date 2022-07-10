const { ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs");
const pjson = require('../../package.json');
const child_process = require("child_process");
const fixPath = require("fix-path");

const { 
    getFolderStructure, 
    getRandomTexFileInFolder, 
    createFolderStructureHTML,
    generateHeader
} = require("../utility");

const { AUTOSAVE_INTERVAL } = require("../parameters");

window.addEventListener("DOMContentLoaded", () => {
    fixPath();
    let texFilePath = "";
    let openedFolderPath = "";
    let autosaveInterval;

    /* HTML elements */
    const el = {
        fileName: document.getElementById("fileName"),
        createFileBtn: document.getElementById("createFileBtn"),
        openFileBtn: document.getElementById("openFileBtn"),
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
        titleAndLogo: document.getElementById("titleAndLogo"),
        errorsPanel: document.getElementById("errorsPanel"),
        showErrorsPanelBtn: document.getElementById("showErrorsPanelBtn"),
        inputErrorsResizer: document.getElementById("inputErrorsResizer"),
    };

    // Update the footer version label
    el.elementsVersionLabel.innerHTML = "Version " + pjson.version;

    // Initially disable the text area
    el.fileTextarea.firstChild.disabled = true;

    const updateFolderTree = (folderPath) => {
        // Update the folder tree
        htmlCode = createFolderStructureHTML(getFolderStructure(folderPath));
        el.folderTree.innerHTML = "<ul>\n" + htmlCode + "\n<ul/>";

        const deleteButtons = document.getElementsByClassName("delete-button");
        for (let i = 0; i < deleteButtons.length; i++) {
            deleteButtons[i].addEventListener("click", () => {
                const deletedFilePath = deleteButtons[i].parentElement.parentElement.id;
                ipcRenderer.send("delete-file-triggered", deletedFilePath);
            });
        };
    };

    const handleFileChange = (filePath, content) => {
        /* On file change, updates the side file structure tree, text area and line count */
        texFilePath = filePath;

        // Update the structure tree (WIP)
        el.fileName.innerHTML = generateHeader(texFilePath, openedFolderPath, false);
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
        if (texFilePath == "" || texFilePath.indexOf(folderPath) == -1) {
            const randomTexFile = getRandomTexFileInFolder(folderPath)
            if (randomTexFile != "") ipcRenderer.send("open-given-file", randomTexFile);
        }
        
        openedFolderPath = folderPath;
        el.fileName.innerHTML = generateHeader(texFilePath, openedFolderPath, false);
    };

    const launchPDFLatexCommand = () => {
        el.errorsPanel.innerHTML = "";
        
        const command = "cd \"" + path.dirname(texFilePath) + "\" && " + "pdflatex \"" + path.basename(texFilePath) + "\"";
        const result = child_process.spawn(command, {shell: true});

        result.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
            if (String(data).toLowerCase().indexOf("warning") != -1) {
                el.errorsPanel.innerHTML += "<div class='warning output'>" + data + "</div>";
            }
            else if (String(data) != ">") { // TODO: investigate this later
                el.errorsPanel.innerHTML += "<div class='stdout output'>" + data + "</div>";
            }
        });

        result.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
            el.errorsPanel.innerHTML += "<div class='stderr output'>" + data + "</div>";
        });

        result.on('close', (code) => {
            el.errorsPanel.innerHTML +=  "<div class='compilation-finished output'>Compilation finished with code "+ code + "</div>\n";
            el.errorsPanel.scrollTo({
                top: 10000,
                left: 0,
                behavior: 'smooth'
              });
            handleFolderChange(openedFolderPath);
            updatePDFPanel();
        });

        result.on('error', (err) => {
            console.error("Command error: " + err);
        });
    };

    const updatePDFPanel = () => {
        /* Uses pdfjs to show the matching pdf file into the dedicated panel */

        const viewerEle = document.getElementById('pdfViewerPanel');

        const pdfPath = texFilePath.slice(0, -3) + "pdf"; // path of the matching PDF document

        fs.stat(pdfPath, function(err, stat) {
            if (err == null) {
                viewerEle.innerHTML = ""; // destroy the old instance of PDF.js (if it exists)

                // Create an iframe that points to our PDF.js viewer, and tell PDF.js to open the file that was selected from the file picker.
                const iframe = document.createElement('iframe');
                iframe.src = path.join(__dirname, `../libs/pdfjs/web/viewer.html?file=${pdfPath}#pagemode=none&zoom=80`);

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
            el.fileName.innerHTML = generateHeader(texFilePath, openedFolderPath, false);
        }
    };

    el.createFileBtn.addEventListener("click", () => {
        saveCurrentFile();
        ipcRenderer.send("create-file-triggered");
    });

    el.openFileBtn.addEventListener("click", () => {
        saveCurrentFile();
        ipcRenderer.send("open-file-triggered");
    });

    el.openFolderBtn.addEventListener("click", () => {
        saveCurrentFile();
        ipcRenderer.send("open-folder-triggered");
    });

    el.compileCodeBtn.addEventListener("click", () => {
        saveCurrentFile();
        launchPDFLatexCommand();
    });

    el.titleAndLogo.addEventListener("click", () => {
        saveCurrentFile();
        ipcRenderer.send("return-to-startup-window");
    });

    const switchPanelDisplayMin = (button, minimizedPanel, resizer, otherPanel) => {
        if (button.getAttribute("state") == "open") {
            //otherPanel.setAttribute("saved-width", minimizedPanel.offsetWidth);
            minimizedPanel.style.display = "none";
            resizer.style.display = "none";
            button.setAttribute("state", "closed");
            otherPanel.style.width = "100%";
            otherPanel.style.flex = "1";
        }
        else {
            minimizedPanel.style.display = "flex";
            resizer.style.display = "block";
            button.setAttribute("state", "open");
            otherPanel.style.flex = "none";
            //otherPanel.style.width = minimizedPanel.getAttribute("saved-width");
        };
    };

    el.sidePanelCloseBtn.addEventListener("click", () => {
        switchPanelDisplayMin(el.sidePanelCloseBtn, el.sideDevelopmentResizer.previousElementSibling, el.sideDevelopmentResizer, el.sideDevelopmentResizer.nextElementSibling);
    });

    el.pdfViewerCloseBtn.addEventListener("click", () => {
        switchPanelDisplayMin(el.pdfViewerCloseBtn, el.codePdfResizer.nextElementSibling, el.codePdfResizer, el.codePdfResizer.previousElementSibling);
    });

    el.fileTextarea.addEventListener("input", () => {
        el.fileName.innerHTML = generateHeader(texFilePath, openedFolderPath, true);

        lineCount = 1;
        lines = el.fileTextarea.value.match(/\n/g);
        if (lines != null) lineCount = lines.length + 1;
        el.lineCountLabel.innerHTML = "Lines: " + lineCount;
    });

    el.reloadFolderBtn.addEventListener("click", () => {
        saveCurrentFile();
        handleFolderChange(openedFolderPath);
    });

    el.showErrorsPanelBtn.addEventListener("click", () => {
        switchPanelDisplayMin(el.showErrorsPanelBtn, el.errorsPanel, el.inputErrorsResizer, el.fileTextarea);
    });

    ipcRenderer.on("save-file-triggered", (_) => {
        saveCurrentFile();
        launchPDFLatexCommand();
    });
   
    ipcRenderer.on("file-created", (_, filePath) => {
        handleFileChange(filePath, "");
    });

    ipcRenderer.on("file-opened", (_, {filePath, content}) => {
        handleFileChange(filePath, content);
    });

    ipcRenderer.on("folder-opened", (_, { folderPath }) => {
        handleFolderChange(folderPath);
    });

    ipcRenderer.on("request-compile", (_) => {
        saveCurrentFile();
        launchPDFLatexCommand();
    });

    ipcRenderer.on("request-folder-reload", (_) => {
        handleFolderChange(openedFolderPath);
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
            else if(elem.classList.contains("folder"))
            {
                if (elem.classList.contains("opened")) {
                    elem.classList.remove("opened");
                    elem.classList.add("closed");
                }
                else {
                    elem.classList.remove("closed");
                    elem.classList.add("opened");
                }
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