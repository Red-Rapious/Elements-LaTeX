# Elements LaTeX
A cross-platform, powerful electron-based LaTeX editor. Stable release v0.0.2 now available for macOS.

![release badge](https://img.shields.io/github/v/release/red-rapious/elements-latex.svg)
<img src="https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png" alt="license" height="20px"/>

## Preview
This is the current interface of Elements LaTeX, still at a very early development state:
![Current interface screenshot](/assets/screenshots/current_screenshot.png)

## Using Elements LaTeX on macOS
Simply download [the latest release](https://github.com/Red-Rapious/Elements-LaTeX/releases) and install it. MacOS will probably block the app opening because "the developper isn't identified". I'm currently working on this issue, but you can in the meantime work around by clicking Show in Finder and Ctrl + click on the app icon.

To compile a document, you'll need to have a LaTeX installation. I recommend [XeLaTeX](https://www.tug.org/xelatex/), but you can use any other LaTeX installation as long as the `pdflatex` command is available.

## Building the project from source
Start by [installing `Node.js`](https://nodejs.org/en/download/) and git if not already done. Type the following commands to clone the `Elements-LaTeX` repository and install the dependencies:

```
mkdir elements-latex
cd elements-latex
git clone https://github.com/Red-Rapious/Elements-LaTeX
npm install electron -D

npm install electron-reloader -D
npm install electron-builder -D
npm install electron-settings -D
npm install fix-path@v3.0.0 -D
```

Download the `PDF.js` library [here](https://github.com/mozilla/pdf.js/releases/download/v2.14.305/pdfjs-2.14.305-dist.zip), and add the extracted `pdfjs` folder in `elements-latex/src/libs`.

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
|    │   └─── code-input (submodule)
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

## Developpement status
Currently working on v0.0.3: middle phase of developpement.

## License
This work is licensed under the [CC-BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) license.

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
| Startup window | :large_orange_diamond: | v 0.0.2 |
| Show erros during compilation | :x: | v 0.0.2 |
| Line numbers | :x: | v 0.0.2 |
| Interface embellishment | :x: | v 0.0.2 |
| Quick interface changes buttons | :x: | v 0.0.2 |
| File structure (inverse search) | :x: | v 0.0.3 |
| Integrated git support | :x: | v 0.0.4 |
| Default templates | :x: | v 0.0.4 |
| Settings panel | :x: | v 0.0.5 |
| Text editor features (find, ...) | :x: | v 0.0.5 |
| Autocompletion | :x: | v 0.0.6 |


- :white_check_mark: Implemented
- :large_orange_diamond: In active development
- :x: Not implemented yet