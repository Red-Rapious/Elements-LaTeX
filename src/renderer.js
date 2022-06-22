const { ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs");
const pjson = require('../package.json');
const child_process = require("child_process");
const fixPath = require("fix-path");

const AUTOSAVE_INTERVAL = 5*60*1000; // 5 minutes

const getExtension = (fileName) => {
    const segments = fileName.split(".")
    const extension = segments[segments.length - 1];
    return extension;
};

const getFolderStructure = (dir) => {
    var result = [];

    fs.readdirSync(dir).forEach(function(file) {
        var stat = fs.statSync(dir+'/'+file);

        if (stat && stat.isDirectory()) {
            result.push(getFolderStructure(dir+'/'+file));
        } 
        else {
            if (file != ".DS_Store") result.push([[file, dir+'/'+file], []]);
        }
    });

    return [path.basename(dir), result];
}

const createFolderStructureHTML = (folderStructure) => {
    var htmlCode = "";

    if (folderStructure[1].length == 0) {
        // TODO: SEPARATE TEX, PDF, AND OTHERS
        var icons = "";
        var classes = "";
        
        switch (getExtension(folderStructure[0][0])) {
            case "pdf":
                icons = "fa fa-align-justify";
                classes = "file file-pdf";
                break;
            case "tex":
                icons = "fa fa-code";
                classes = "file file-tex";
                break;
            case "aux":
            case "log":
                icons = "fa fa-gear";
                classes = "file file-other";
                break;
            default:
                icons = "fa fa-file";
                classes = "file file-other";
        }
        htmlCode = "<li class=\"" + classes + "\" id=\"" + folderStructure[0][1] + "\"><i class=\"" + icons +"\"></i> " + folderStructure[0][0] + " </li>\n";
    }
    else {
        htmlCode += "<li><i class=\"fa fa-angle-down\"></i> " + folderStructure[0];
        for (var i = 0 ; i < folderStructure[1].length ; i++)
        {
            htmlCode +=  "\n<ul> " + createFolderStructureHTML(folderStructure[1][i]) + " </ul> ";
        }
        htmlCode += "\n</li>";
    }
    return htmlCode;
};

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
    };

    // Update the footer version label
    el.elementsVersionLabel.innerHTML = "Version " + pjson.version;

    const handleDocumentChange = (filePath, content = "") => {
        /* On document change, updates the side file structure tree, text area and line count */

        texDocumentPath = filePath;
        el.documentName.innerHTML = path.parse(filePath).base;
        el.structureTree.innerHTML = "<ul><li><i class=\"fa fa-file\"></i> " + path.parse(filePath).base + "</li>"

        updatePDFPanel();

        el.fileTextarea.removeAttribute("disabled");
        el.fileTextarea.value = content;
        el.fileTextarea.focus();

        lineCount = 1;
        lines = el.fileTextarea.value.match(/\n/g);
        if (lines != null) lineCount = lines.length + 1;
        el.lineCountLabel.innerHTML = "Lines: " + lineCount;

        clearInterval(autosaveInterval);
        autosaveInterval = setInterval(saveCurrentFile, AUTOSAVE_INTERVAL);
    };

    const handleFolderChange = (folderPath) => {
        /* On folder change, updates the side folder structure tree */

        openedFolderPath = folderPath
        htmlCode = createFolderStructureHTML(getFolderStructure(openedFolderPath));
        el.folderTree.innerHTML = "<ul>\n" + htmlCode + "\n<ul/>";
    };

    const launchPDFLatexCommand = (filePath) => {
        const command = "cd " + path.dirname(texDocumentPath) + " && " + "pdflatex " + path.basename(texDocumentPath);
        const result = child_process.spawn(command, {shell: true});

        result.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        result.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        result.on('close', (code) => {
            // TODO: change to the current folder path
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
        viewerEle.innerHTML = ''; // destroy the old instance of PDF.js (if it exists)

        const pdfPath = texDocumentPath.slice(0, -3) + "pdf"; // path of the matching PDF document

        fs.stat(pdfPath, function(err, stat) {
            if (err == null) {
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
        ipcRenderer.send("update-file-content", el.fileTextarea.value);
        el.documentName.innerHTML = path.parse(texDocumentPath).base;
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
        launchPDFLatexCommand(texDocumentPath);
    });

    el.fileTextarea.addEventListener("input", () => {
        el.documentName.innerHTML = path.parse(texDocumentPath).base + " (modified)";

        lineCount = 1;
        lines = el.fileTextarea.value.match(/\n/g);
        if (lines != null) lineCount = lines.length + 1;
        el.lineCountLabel.innerHTML = "Lines: " + lineCount;
    });

    ipcRenderer.on("save-file-triggered", (_) => {
        saveCurrentFile();
        launchPDFLatexCommand(texDocumentPath);
    });
   
    ipcRenderer.on("document-created", (_, filePath) => {
        handleDocumentChange(filePath);
    });

    ipcRenderer.on("document-opened", (_, {filePath, content}) => {
        handleDocumentChange(filePath, content);
    });

    ipcRenderer.on("folder-opened", (_, { folderPath }) => {
        handleFolderChange(folderPath);
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