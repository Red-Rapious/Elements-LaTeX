# Elements LaTeX
A cross-platform, powerful electron-based LaTeX editor.
Coming soon.

## Preview
This is the current interface of Elements LaTeX, still at a very early development state:
![Current interface screenshot](/assets/current_screenshot.png)

## Building the project
This project uses `npm` and `electron`.

Start by [installing `Node.js`](https://nodejs.org/en/download/) if not already done. Type the following commands to clone the `Elements-LaTeX` repository and install the dependencies:

```
mkdir elements-latex
cd elements-latex
git clone https://github.com/Red-Rapious/Elements-LaTeX
npm install electron -D

npm install electron-reloader -D
npm install electron-builder -D
```

Then, to start the project, type:

```
npm run start
```

If you want to build the project, you can lauch:

```
npm run build
```

## Developpement status
Currently working on v 0.0.1: early phase of developpement.

## Features
| Feature | Status | Planned for |
| ------- | ------ | ----------- |
| Full interface structure | :large_orange_diamond: | v 0.0.1 |
| Create and open a folder/file | :x: | v 0.0.1 |
| Modify and save file efficently | :x: | v 0.0.2 |
| Compile file and show errors | :x: | v 0.0.3 |
| Show generated PDF | :x: | v 0.0.4 |

- :white_check_mark: Implemented
- :large_orange_diamond: In active development
- :x: Not implemented yet

## License
This work is licensed under the [CC-BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) license.