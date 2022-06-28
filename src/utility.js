const { Notification } = require("electron");
const path = require("path");
const fs = require("fs");

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

const getTexFileInFolder = (folder) => {
    /* Recursively search for a tex file in a folder */
    var texFile = "";
    fs.readdirSync(folder).forEach(function(file) {
        var stat = fs.statSync(folder+'/'+file);

        if (stat && stat.isDirectory()) {
            const result = getTexFileInFolder(folder+'/'+file);
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

const handleError = (location = "undefined") => {
    new Notification({
        title: "Error",
        body: "An error occured during " + location,
    }).show();

    //alert("An error occured during " + location);
};

module.exports = { getExtension, getFolderStructure, getTexFileInFolder, createFolderStructureHTML, handleError };