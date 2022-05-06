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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deeplink = void 0;
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var os_1 = __importDefault(require("os"));
var events_1 = require("events");
var stub_1 = __importDefault(require("./stub"));
var templates_1 = require("./templates");
var electronDeeplink = os_1.default.platform() === 'darwin' ? require('bindings')('electron-deeplink.node') : stub_1.default;
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
            var bundleURL = templates_1.infoPlistTemplate.replace(/{PROTOCOL}/g, protocol);
            var infoPlist;
            _this.appPath = _this.app.getAppPath();
            _this.electronPath = path_1.default.join(_this.appPath, _this.config.electronPath);
            _this.infoPlistFile = path_1.default.join(_this.electronPath, '/Contents/Info.plist');
            _this.infoPlistFileBak = path_1.default.join(_this.electronPath, '/Contents/Info.deeplink');
            if (fs_1.default.existsSync(_this.infoPlistFileBak)) {
                infoPlist = fs_1.default.readFileSync(_this.infoPlistFileBak, 'utf-8');
            }
            else {
                infoPlist = fs_1.default.readFileSync(_this.infoPlistFile, 'utf-8');
                fs_1.default.writeFileSync(_this.infoPlistFileBak, infoPlist);
            }
            infoPlist = infoPlist.replace('com.github.Electron', "com.deeplink." + protocol);
            infoPlist = infoPlist.replace(/<\/dict>\n<\/plist>/, bundleURL);
            fs_1.default.writeFileSync(_this.infoPlistFile, infoPlist);
            return electronDeeplink.SetRuntimeAppProtocol(_this.electronPath, protocol, debugLogging);
        };
        _this.secondInstanceEvent = function (event, argv) {
            var debugLogging = _this.config.debugLogging;
            if (os_1.default.platform() === 'darwin' && debugLogging) {
                _this.logger.error("electron-deeplink: the app event 'second-instance' fired, this should not of happened, please check your packager bundleId config");
                return;
            }
            if (os_1.default.platform() === 'darwin') {
                _this.emit.apply(_this, __spreadArrays(['received'], argv));
            }
            else {
                _this.emit('received', argv.slice(-1).join(''));
            }
            if (_this.mainWindow) {
                if (_this.mainWindow.isMinimized()) {
                    _this.mainWindow.restore();
                }
                _this.mainWindow.focus();
            }
        };
        _this.darwinOpenEvent = function (event, url, eventName) {
            event.preventDefault();
            var debugLogging = _this.config.debugLogging;
            if (debugLogging) {
                _this.logger.debug("electron-deeplink: " + eventName + ": " + url);
            }
            _this.emit('received', url);
        };
        _this.restoreInfoPlist = function () {
            var _a = _this.config, debugLogging = _a.debugLogging, isDev = _a.isDev;
            if (!isDev || os_1.default.platform() !== 'darwin') {
                return;
            }
            if (_this.infoPlistFile && _this.infoPlistFileBak && fs_1.default.existsSync(_this.infoPlistFileBak)) {
                var infoPlist = fs_1.default.readFileSync(_this.infoPlistFileBak, 'utf-8');
                if (debugLogging) {
                    _this.logger.debug("electron-deeplink: restoring Info.plist");
                }
                fs_1.default.writeFileSync(_this.infoPlistFile, infoPlist);
            }
        };
        _this.getProtocol = function () { return _this.config.protocol; };
        _this.getLogfile = function () {
            return _this.logger ? _this.logger.transports.file.getFile().path : 'debugLogging is disabled';
        };
        var app = config.app, mainWindow = config.mainWindow, protocol = config.protocol, _a = config.isDev, isDev = _a === void 0 ? false : _a, _b = config.debugLogging, debugLogging = _b === void 0 ? false : _b, _c = config.electronPath, electronPath = _c === void 0 ? '/node_modules/electron/dist/Electron.app' : _c;
        _this.checkConfig(config);
        _this.config = { protocol: protocol, debugLogging: debugLogging, isDev: isDev, electronPath: electronPath };
        _this.app = app;
        _this.mainWindow = mainWindow;
        if (debugLogging) {
            _this.logger = require('electron-log');
            _this.logger.transports.file.level = 'debug';
            _this.logger.debug("electron-deeplink: debugLogging is enabled");
        }
        var instanceLock = process.mas === true || app.requestSingleInstanceLock();
        if (!instanceLock) {
            if (debugLogging) {
                _this.logger.debug("electron-deeplink: unable to lock instance");
            }
            app.quit();
            return _this;
        }
        if (isDev && os_1.default.platform() === 'darwin') {
            var handlerDebug_1 = _this.setAppProtocol();
            if (debugLogging) {
                Object.keys(handlerDebug_1).forEach(function (key) {
                    _this.logger.debug("electron-deeplink:NAPI: " + key + ": " + (Array.isArray(handlerDebug_1[key]) ? JSON.stringify(handlerDebug_1[key]) : handlerDebug_1[key]));
                });
            }
        }
        if (os_1.default.platform() === 'darwin') {
            app.setAsDefaultProtocolClient(protocol);
            app.on('will-finish-launching', function () {
                app.on('open-url', function (event, url) { return _this.darwinOpenEvent(event, url, 'open-url'); });
                app.on('open-file', function (event, url) { return _this.darwinOpenEvent(event, url, 'open-file'); });
            });
        }
        else {
            var args = process.argv[1] ? [path_1.default.resolve(process.argv[1])] : [];
            app.setAsDefaultProtocolClient(protocol, process.execPath, args);
        }
        app.on('second-instance', _this.secondInstanceEvent);
        return _this;
    }
    return Deeplink;
}(events_1.EventEmitter));
exports.Deeplink = Deeplink;
