# Source Code Review Instructions

## Project Description

This is a browser extension that allows the user to pin conversations on the chatgpt website for quick access

## Prerequisites

- Ensure you have the following software installed on your machine:
  - [Windows 11](https://www.microsoft.com/en-us/windows/get-windows-11)
  - [Node.js](https://nodejs.org/) (version 20 or higher)
  - [NPM](https://www.npmjs.com/) (version 9.3.1 or higher)

## Installation Instructions

1. Install the dependencies:

   ```sh
   npm install
   ```

2. Build the project:

   - For Firefox: Run the following command to build the Firefox version of the extension:

   ```sh
   npm run build:firefox
   ```

   - For Chrome: Run the following command to build the Chrome version of the extension:

   ```sh
   npm run build
   ```

3. Load the extension in your browser for testing:
   - For Firefox: Go to `about:debugging#/runtime/this-firefox` and click on "Load Temporary Add-on". Then open the `.output` folder in the root project folder and select the `pinflux-X.Y.Z-firefox.zip` file.
   - For Chrome: Go to `chrome://extensions`, enable "Developer mode", and click on "Load unpacked". Then select the `.output` folder in the root project folder and select the `chrome-mv3` folder.
