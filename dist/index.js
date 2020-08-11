"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deeplink = void 0;
var electronDeeplink = require('bindings')('electron-deeplink.node');
var path = require('path');
var fs = require('fs');
var os = require('os');
var EventEmitter = require('events');
var infoPlistTemplate = require('./templates').infoPlistTemplate;
var Deeplink = /** @class */ (function () {
    function Deeplink(config) {
        var _this = this;
        this.checkConfig = function () {
            var expectedKeys = ['app', 'mainWindow', 'protocol'];
            var configKeys = Object.keys(_this.config);
            var missingKeys = expectedKeys.filter(function (expectedKey) {
                return !configKeys.includes(expectedKey);
            });
            if (missingKeys.length > 0) {
                throw Error("electron-deeplink: missing config attributes: " + missingKeys.join(', '));
            }
        };
        this.createHandlerApp = function () {
            var _a = _this.config, app = _a.app, protocol = _a.protocol, debugLogging = _a.debugLogging;
            if (os.platform() !== 'darwin') {
                return;
            }
            var bundleURL = infoPlistTemplate.replace(/{PROTOCOL}/g, protocol);
            var infoPlist;
            _this.appPath = app.getAppPath();
            _this.electronPath = path.join(_this.appPath, '/node_modules/electron/dist/Electron.app');
            _this.infoPlistFile = path.join(_this.electronPath, '/Contents/Info.plist');
            _this.infoPlistFileBak = path.join(_this.electronPath, '/Contents/Info.deeplink');
            if (fs.existsSync(_this.infoPlistFileBak)) {
                infoPlist = fs.readFileSync(_this.infoPlistFileBak, 'utf-8');
            }
            else {
                infoPlist = fs.readFileSync(_this.infoPlistFile, 'utf-8');
                fs.writeFileSync(_this.infoPlistFileBak, infoPlist);
            }
            infoPlist = infoPlist.replace('com.github.Electron', "com.deeplink." + protocol);
            infoPlist = infoPlist.replace(/<\/dict>\n<\/plist>/, bundleURL);
            fs.writeFileSync(_this.infoPlistFile, infoPlist);
            return electronDeeplink.SetRuntimeAppProtocol(_this.electronPath, protocol, debugLogging);
        };
        this.emitter = function (event, url, eventName) {
            event.preventDefault();
            var debugLogging = _this.config.debugLogging;
            if (debugLogging) {
                _this.logger.debug("electron-deeplink: " + eventName + ": " + url);
            }
            if (_this.events) {
                _this.events.emit('received', url);
            }
        };
        this.restoreInfoPlist = function () {
            var _a = _this.config, debugLogging = _a.debugLogging, isDev = _a.isDev;
            if (!isDev || os.platform() !== 'darwin') {
                return;
            }
            if (fs.existsSync(_this.infoPlistFileBak)) {
                var infoPlist = fs.readFileSync(_this.infoPlistFileBak, 'utf-8');
                if (debugLogging) {
                    _this.logger.debug("electron-deeplink: restoring Info.plist");
                }
                fs.writeFileSync(_this.infoPlistFile, infoPlist);
            }
        };
        this.getProtocol = function () { return _this.config.protocol; };
        this.getLogfile = function () {
            return _this.logger ? _this.logger.transports.file.getFile().path : 'debugLogging is disabled';
        };
        var app = config.app, mainWindow = config.mainWindow, protocol = config.protocol, _a = config.isDev, isDev = _a === void 0 ? false : _a, _b = config.debugLogging, debugLogging = _b === void 0 ? false : _b;
        this.config = { app: app, mainWindow: mainWindow, protocol: protocol, isDev: isDev, debugLogging: debugLogging };
        if (debugLogging) {
            this.logger = require('electron-log');
            this.logger.transports.file.level = 'debug';
            this.logger.debug("electron-deeplink: debugLogging is enabled");
        }
        this.checkConfig();
        var instanceLock = app.requestSingleInstanceLock();
        if (!instanceLock) {
            if (debugLogging) {
                this.logger.debug("electron-deeplink: unable to lock instance");
            }
            app.quit();
            return;
        }
        this.events = new EventEmitter();
        if (isDev) {
            var handlerDebug_1 = this.createHandlerApp();
            if (debugLogging) {
                Object.keys(handlerDebug_1).forEach(function (key) {
                    _this.logger.debug("electron-deeplink: HANDLER: " + key + ": " + (Array.isArray(handlerDebug_1[key]) ? JSON.stringify(handlerDebug_1[key]) : handlerDebug_1[key]));
                });
            }
        }
        if (!app.isDefaultProtocolClient(protocol)) {
            app.setAsDefaultProtocolClient(protocol);
        }
        app.on('second-instance', function (event, url) { return _this.emitter(event, url, 'second-instance'); });
        app.on('open-url', function (event, url) { return _this.emitter(event, url, 'open-url'); });
        app.on('open-file', function (event, url) { return _this.emitter(event, url, 'open-file'); });
    }
    return Deeplink;
}());
exports.Deeplink = Deeplink;
