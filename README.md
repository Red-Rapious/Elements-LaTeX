<p align="center"><img src="assets/logos/icon.png" alt="Elements LaTeX" width="100" height="100"></p>
<h1 align="center">Elements LaTeX</h1>

<div align="center">
A cross-platform, powerful electron-based LaTeX editor.
<h5 align="center">Stable release v0.0.3 now available for macOS.</h5>
</div>

<p></p>
<div align="center">

[![release badge](https://img.shields.io/github/v/release/red-rapious/elements-latex?color=green)](https://github.com/Red-Rapious/Elements-LaTeX/releases/)
[<img src="https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png" alt="license" height="20px"/>](https://creativecommons.org/licenses/by-nc-sa/4.0/)
</div>

<div align="center">

<!--![files count badge](https://img.shields.io/github/directory-file-count/red-rapious/elements-latex)-->
[![repo size badge](https://img.shields.io/github/repo-size/red-rapious/elements-latex)](https://github.com/Red-Rapious/Elements-LaTeX/)
[![line count badge](https://img.shields.io/tokei/lines/github/red-rapious/elements-latex)](https://github.com/Red-Rapious/Elements-LaTeX/)
[![commit activity](https://img.shields.io/github/commit-activity/w/red-rapious/elements-latex?color=green)](https://github.com/Red-Rapious/Elements-LaTeX/commits/master)
</div>

## Preview
This is the current interface of Elements LaTeX, currently in active development:
![Current interface screenshot](/assets/screenshots/current_screenshot.png)

## Using Elements LaTeX on macOS
Simply download [the latest release](https://github.com/Red-Rapious/Elements-LaTeX/releases) and install it. MacOS will probably block the app opening because "the developper isn't identified". Until I sign the application with an Apple Developper Account, you can work around by clicking Show in Finder and `Ctrl + click` on the app icon.

To compile a document, you'll need to have a LaTeX installation. You can download it [on the official website](https://www.latex-project.org/get/), but you can use any other LaTeX installation as long as the `pdflatex` command is available.

## Building the project from source
Start by [installing `Node.js`](https://nodejs.org/en/download/) and `git` if not already done. Type the following commands to clone the `Elements-LaTeX` repository and install the dependencies:

```
mkdir elements-latex
cd elements-latex
git clone https://github.com/Red-Rapious/Elements-LaTeX
npm install electron -D

npm install electron-settings -D
npm install fix-path@v3.0.0 -D
npm install electron-context-menu -D
```

> Note: this library might be included as a submodule in the future (or using the `electron-pdf-viewer` node package), but you'll need to install it by yourself to build the project in it's current state.

To do so, download the `PDF.js` library [here](https://github.com/mozilla/pdf.js/releases/download/v2.14.305/pdfjs-2.14.305-dist.zip), and add the extracted `pdfjs` folder in `elements-latex/src/libs`.

Finally, the `code-input` submodules seems to be broken, so you'll need to install a previous version manually. Download the v1.0.3 [release here](https://github.com/WebCoder49/code-input/archive/refs/tags/v1.0.3.zip) and extract it in `elements-latex/src/libs/code-input-1.0.3`. I'll try to fix this submodule issue ASAP, sorry for the inconvenience.

The final project structure should look as follows:

```
elements-latex
│   README.md
│   ...   
└─── assets
└─── src
|    └─── libs
|    │   └─── pdfjs
|    │       └─── build
|    |       └─── web
|    │   └─── code-input-1.0.3
|    │   └─── ... (other submodules)
└─── node_modules
└─── ...
```

Then, to start the project, type:

```
npm start
```

> Note: working with `.tex` files contained in the `elements-latex` folder is not recommended, and can cause diverse issues.

If you want to build the project, you can lauch:

```
npm run build
```

> Note: this `npm` script uses the `electron-builder` package to build the project: you can install it by launching `npm install electron-builder -D`.

## Developpement status
Currently working on v0.0.3: middle phase of developpement.

## License
This work is licensed under the [CC-BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) license.

## Contributors
- <img src="https://github.com/Red-Rapious.png" alt="avatar" height="15px"/>  [Red-Rapious](https://github.com/Red-Rapious): Project lead and main developer.
- <img src="https://github.com/Marilabs.png" alt="avatar" height="15px"/>   [Marilabs](https://github.com/marilabs): Logo creator and UX designer.

## Features list
| Feature | Status | Planned for |
| ------- | ------ | ----------- |
| Resizable panels mechanism | :white_check_mark: | v 0.0.0 |
| Full interface structure | :white_check_mark: | v 0.0.1 |
| Create and open a folder/file | :white_check_mark: | v 0.0.1 |
| Modify and save file efficently | :white_check_mark: | v 0.0.1 |
| Show generated PDF | :white_check_mark: | v 0.0.1 |
| Compile file | :white_check_mark: | v 0.0.2 |
| Syntax highlightning | :white_check_mark: | v 0.0.2 |
| Quick interface changes buttons | :white_check_mark: | v 0.0.3 |
| Startup window | :white_check_mark: | v 0.0.3 |
| Show erros during compilation | :x: | v 0.0.4 |
| Line numbers | :x: | v 0.0.4 |
| Interface embellishment | :x: | v 0.0.4 |
| File structure (inverse search) | :x: | v 0.0.5 |
| Default templates | :x: | v 0.0.5 |
| Settings panel | :x: | v 0.0.6 |
| Integrated git support | :x: | v 0.0.6 |
| Text editor features (find, ...) | :x: | v 0.0.7 |
| Autocompletion | :x: | v 0.0.8 |


- :white_check_mark: Implemented
- :large_orange_diamond: In active development
- :x: Not implemented yet