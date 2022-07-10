const { Notification } = require("electron");
const path = require("path");
const fs = require("fs");
const { isDevelopementEnvironement } = require("./parameters")

const STARTUP_WINDOW_CLICK_TYPE = {
    NONE: 0,
    OPEN_FILE: 1,
    OPEN_FOLDER: 2,
};

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

const getRandomTexFileInFolder = (folder) => {
    /* Recursively search for a tex file in a folder */
    var texFile = "";
    fs.readdirSync(folder).forEach(function(file) {
        var stat = fs.statSync(folder+'/'+file);

        if (stat && stat.isDirectory()) {
            const result = getRandomTexFileInFolder(folder+'/'+file);
            if (result != "") texFile = result;
        } 
        else {
            if (getExtension(file) == "tex") texFile = folder + "/" + file;
        }
    });

    return texFile;
};

const createFolderStructureHTML = (folderStructure) => {
    var htmlCode = "";

    if (typeof folderStructure[0] !== "string" && folderStructure[1].length == 0) {
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
        const iconsContainer = "<div class='icons-container'><i class='fa fa-trash-can delete-button'></i><i class='" + icons +" file-type-icon'></i> " + "</div>";
        htmlCode = "<li class='" + classes + "' id='" + folderStructure[0][1] + "'>" + iconsContainer + folderStructure[0][0] + " </li>\n";
    }
    else {
        htmlCode += "<li class='folder opened'><i class='fa fa-angle-down'></i><i class='fa fa-angle-right'></i> " + folderStructure[0];
        for (var i = 0 ; i < folderStructure[1].length ; i++)
        {
            htmlCode +=  "\n<ul> " + createFolderStructureHTML(folderStructure[1][i]) + " </ul> ";
        }
        htmlCode += "\n</li>";
    }
    return htmlCode;
};

const handleError = (location = "undefined", error = "error unspecified") => {
    const message = "An error occured during " + location + ": " + error;
    if (isDevelopementEnvironement) {
        new Notification({
            title: "Elements LaTeX: error",
            body: message,
        }).show();
    }
    else {
        console.log(message);
    }
};

const generateHeader = (filePath, folderPath, modified=false) => {
    return path.parse(folderPath).base + " - " + path.parse(filePath).base + (modified ? " (modified)" : "");
};

module.exports = { STARTUP_WINDOW_CLICK_TYPE, getExtension, getFolderStructure, getRandomTexFileInFolder, createFolderStructureHTML, handleError, generateHeader };