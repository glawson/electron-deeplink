"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deeplink = void 0;
var path = require('path');
var fs = require('fs');
var os = require('os');
var EventEmitter = require('events');
var electronDeeplink = os.platform() === 'darwin' ? require('bindings')('electron-deeplink.node') : require('./stub');
var infoPlistTemplate = require('./templates').infoPlistTemplate;
var Deeplink = /** @class */ (function (_super) {
    __extends(Deeplink, _super);
    function Deeplink(config) {
        var _this = _super.call(this) || this;
        _this.checkConfig = function (config) {
            var expectedKeys = ['app', 'mainWindow', 'protocol'];
            var configKeys = Object.keys(config);
            var missingKeys = expectedKeys.filter(function (expectedKey) {
                return !configKeys.includes(expectedKey);
            });
            if (missingKeys.length > 0) {
                throw new Error("electron-deeplink: missing config attributes: " + missingKeys.join(', '));
            }
        };
        _this.setAppProtocol = function () {
            var _a = _this.config, protocol = _a.protocol, debugLogging = _a.debugLogging;
            var bundleURL = infoPlistTemplate.replace(/{PROTOCOL}/g, protocol);
            var infoPlist;
            _this.appPath = _this.app.getAppPath();
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
        _this.secondInstanceEvent = function (event, argv) {
            if (os.platform() === 'darwin') {
                _this.logger.error("electron-deeplink: the app event 'second-instance' fired, this should not of happened, please check your packager bundleId config");
                return;
            }
            if (os.platform() === 'win32') {
                _this.emit('received', argv.slice(-1).join(''));
            }
            if (_this.mainWindow) {
                if (_this.mainWindow.isMinimized()) {
                    _this.mainWindow.restore();
                }
                _this.mainWindow.focus();
            }
        };
        _this.openEvent = function (event, url, eventName) {
            event.preventDefault();
            var debugLogging = _this.config.debugLogging;
            if (debugLogging) {
                _this.logger.debug("electron-deeplink: " + eventName + ": " + url);
            }
            _this.emit('received', url);
        };
        _this.restoreInfoPlist = function () {
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
        _this.getProtocol = function () { return _this.config.protocol; };
        _this.getLogfile = function () {
            return _this.logger ? _this.logger.transports.file.getFile().path : 'debugLogging is disabled';
        };
        var app = config.app, mainWindow = config.mainWindow, protocol = config.protocol, _a = config.isDev, isDev = _a === void 0 ? false : _a, _b = config.debugLogging, debugLogging = _b === void 0 ? false : _b;
        _this.checkConfig(config);
        _this.config = { protocol: protocol, debugLogging: debugLogging, isDev: isDev };
        _this.app = app;
        _this.mainWindow = mainWindow;
        if (debugLogging) {
            _this.logger = require('electron-log');
            _this.logger.transports.file.level = 'debug';
            _this.logger.debug("electron-deeplink: debugLogging is enabled");
        }
        var instanceLock = process.mas === true ? true : app.requestSingleInstanceLock();
        if (!instanceLock) {
            if (debugLogging) {
                _this.logger.debug("electron-deeplink: unable to lock instance");
            }
            app.quit();
            return _this;
        }
        if (isDev && os.platform() === 'darwin') {
            var handlerDebug_1 = _this.setAppProtocol();
            if (debugLogging) {
                Object.keys(handlerDebug_1).forEach(function (key) {
                    _this.logger.debug("electron-deeplink:NAPI: " + key + ": " + (Array.isArray(handlerDebug_1[key]) ? JSON.stringify(handlerDebug_1[key]) : handlerDebug_1[key]));
                });
            }
        }
        if (os.platform() === 'win32') {
            app.setAsDefaultProtocolClient(protocol, process.execPath, [path.resolve(process.argv[1])]);
        }
        else {
            app.setAsDefaultProtocolClient(protocol);
        }
        app.on('second-instance', _this.secondInstanceEvent);
        app.on('will-finish-launching', function () {
            app.on('open-url', function (event, url) { return _this.openEvent(event, url, 'open-url'); });
            app.on('open-file', function (event, url) { return _this.openEvent(event, url, 'open-file'); });
        });
        return _this;
    }
    return Deeplink;
}(EventEmitter));
exports.Deeplink = Deeplink;
