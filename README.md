[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)
![ts](https://badgen.net/badge/-/TypeScript?icon=typescript&label&labelColor=blue&color=555555)
[![glawson](https://circleci.com/gh/glawson/electron-deeplink.svg?style=shield)](https://circleci.com/gh/glawson/electron-deeplink)

# electron-deeplink

Node module for Electron apps that sets the default handler for a given protocol (deep links) in both
development and production environments.

This module was inspired due to the lack of protocol support when running non packaged apps on macOS (see [`app.setAsDefaultProtocolClient`](https://www.electronjs.org/docs/api/app#appsetasdefaultprotocolclientprotocol-path-args) for explanation). This module provides full support for running and testing the given protocol in the development environment. It also provides the same protocol support for the production envronment. In other words, protocol management is completly controlled with this module.

# Please Note

-   For Production: While electron-deeplink handles setting `app.setAsDefaultProtocolClient`, you still need to make sure setup the mac bundleId correctly for [electron-builder](https://www.electron.build/configuration/configuration) or [electron-forge](https://www.electronforge.io/configuration).

# Example App

A full working example can be found [here](https://github.com/glawson/electron-deeplink-example)

# Installation

```sh
# If you use npm:
npm install electron-deeplink

# If you use yarn:
$ yarn add electron-deeplink
```

# Usage

In `main.js`, include the `electron-deeplink` module and instantiate the Deeplink class towards to begining of `main.js`.

```js
// main.js
const { app, BrowserWindow } = require('electron');
const { Deeplink } = require('electron-deeplink');
const isDev = require('electron-is-dev');

let mainWindow;
const protocol = isDev ? 'dev-app' : 'prod-app';
const deeplink = new Deeplink({ app, mainWindow, protocol, isDev });
```

Setup a watch on the deeplink 'received' event

```js
// main.js
deeplink.on('received', (link) => {
    // do stuff here
});
```

# API

## creating an instance

```js
const deeplink = new Deeplink([config]);
```

## config

```ts
{
    // required
    // type: electron app
    app: [electron.app]

    // required
    // type: app.BrowserWindow
    // Reference to the apps main window
    mainWindow: [main window reference]

    // required
    // type: string
    // String representing the protocol to use. For production, this should be the same as the bundleId set in the build config.
    protocol: [protocol string]

    // optional, default: false
    // type: boolean
    // Represents the app environment
    isDev: boolean

    // optional, default: false
    // type: boolean
    // If true, outputs logging.  Uses electron-log, so files are appened/created for prod.
    debugLogging: boolean

    // optional, default: '/node_modules/electron/dist/Electron.app'
    // type: string
    // String representing the location of Electron relative to the app root.
    electronPath: [string]
}
```

## events

```js
// 'recieved'
// When a "deeplink" is recieved by the module, this event is emitted.

deeplink.on('received', (link) => {
    // do something here
});
```

# Contributors

**This repo uses [semantic-release](https://semantic-release.gitbook.io/) for versioning, which uses [Angular Commit Message Conventions](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines).**

**semantic-release is hooked up to CircleCI**
