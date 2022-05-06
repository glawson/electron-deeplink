import path from 'path';
import fs from 'fs';
import os from 'os';
import { App, BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import stub from './stub';
import { infoPlistTemplate } from './templates';

const electronDeeplink = os.platform() === 'darwin' ? require('bindings')('electron-deeplink.node') : stub;

interface Process extends NodeJS.Process {
    mas: boolean;
}

declare const process: Process;

interface DeeplinkConfig {
    protocol: string;
    app: App;
    mainWindow: BrowserWindow;
    isDev?: boolean;
    debugLogging?: boolean;
    electronPath?: string;
}

interface InstanceConfig {
    protocol: string;
    debugLogging: boolean;
    isDev: boolean;
    electronPath: string;
}

class Deeplink extends EventEmitter {
    private appPath?: string;
    private electronPath?: string;
    private infoPlistFile?: string;
    private infoPlistFileBak?: string;
    private logger?: any;
    private app: App;
    private mainWindow: BrowserWindow;
    private config: InstanceConfig;

    constructor(config: DeeplinkConfig) {
        super();
        const { app, mainWindow, protocol, isDev = false, debugLogging = false, electronPath = '/node_modules/electron/dist/Electron.app' } = config;

        this.checkConfig(config);

        this.config = { protocol, debugLogging, isDev, electronPath };
        this.app = app;
        this.mainWindow = mainWindow;

        if (debugLogging) {
            this.logger = require('electron-log');
            this.logger.transports.file.level = 'debug';
            this.logger.debug(`electron-deeplink: debugLogging is enabled`);
        }

        const instanceLock = process.mas === true || app.requestSingleInstanceLock();

        if (!instanceLock) {
            if (debugLogging) {
                this.logger.debug(`electron-deeplink: unable to lock instance`);
            }
            app.quit();
            return;
        }

        if (isDev && os.platform() === 'darwin') {
            const handlerDebug = this.setAppProtocol();

            if (debugLogging) {
                Object.keys(handlerDebug).forEach((key) => {
                    this.logger.debug(
                        `electron-deeplink:NAPI: ${key}: ${Array.isArray(handlerDebug[key]) ? JSON.stringify(handlerDebug[key]) : handlerDebug[key]}`
                    );
                });
            }
        }

        if (os.platform() === 'darwin') {
            app.setAsDefaultProtocolClient(protocol);

            app.on('will-finish-launching', () => {
                app.on('open-url', (event, url) => this.darwinOpenEvent(event, url, 'open-url'));
                app.on('open-file', (event, url) => this.darwinOpenEvent(event, url, 'open-file'));
            });
        } else {
            const args = process.argv[1] ? [path.resolve(process.argv[1])] : [];
            
            app.setAsDefaultProtocolClient(protocol, process.execPath, args);
        } 

        app.on('second-instance', this.secondInstanceEvent);
    }

    private checkConfig = (config: DeeplinkConfig) => {
        const expectedKeys = ['app', 'mainWindow', 'protocol'];
        const configKeys = Object.keys(config);

        const missingKeys = expectedKeys.filter((expectedKey) => {
            return !configKeys.includes(expectedKey);
        });

        if (missingKeys.length > 0) {
            throw new Error(`electron-deeplink: missing config attributes: ${missingKeys.join(', ')}`);
        }
    };

    private setAppProtocol = () => {
        const { protocol, debugLogging } = this.config;
        const bundleURL = infoPlistTemplate.replace(/{PROTOCOL}/g, protocol);
        let infoPlist;

        this.appPath = this.app.getAppPath();
        this.electronPath = path.join(this.appPath, this.config.electronPath);
        this.infoPlistFile = path.join(this.electronPath, '/Contents/Info.plist');
        this.infoPlistFileBak = path.join(this.electronPath, '/Contents/Info.deeplink');

        if (fs.existsSync(this.infoPlistFileBak)) {
            infoPlist = fs.readFileSync(this.infoPlistFileBak, 'utf-8');
        } else {
            infoPlist = fs.readFileSync(this.infoPlistFile, 'utf-8');
            fs.writeFileSync(this.infoPlistFileBak, infoPlist);
        }

        infoPlist = infoPlist.replace('com.github.Electron', `com.deeplink.${protocol}`);
        infoPlist = infoPlist.replace(/<\/dict>\n<\/plist>/, bundleURL);

        fs.writeFileSync(this.infoPlistFile, infoPlist);

        return electronDeeplink.SetRuntimeAppProtocol(this.electronPath, protocol, debugLogging);
    };

    private secondInstanceEvent = (event: Event, argv: string[]) => {
        const {debugLogging } = this.config;
        if (os.platform() === 'darwin' && debugLogging) {
            this.logger.error(
                `electron-deeplink: the app event 'second-instance' fired, this should not of happened, please check your packager bundleId config`
            );
            return;
        }

        if (os.platform() === 'darwin') {
            this.emit('received', ...argv);
        } else {
            this.emit('received', argv.slice(-1).join(''));
        }

        if (this.mainWindow) {
            if (this.mainWindow.isMinimized()) {
                this.mainWindow.restore();
            }
            this.mainWindow.focus();
        }
    };

    private darwinOpenEvent = (event: any, url: string, eventName: string) => {
        event.preventDefault();
        const { debugLogging } = this.config;

        if (debugLogging) {
            this.logger.debug(`electron-deeplink: ${eventName}: ${url}`);
        }

        this.emit('received', url);
    };

    public restoreInfoPlist = () => {
        const { debugLogging, isDev } = this.config;

        if (!isDev || os.platform() !== 'darwin') {
            return;
        }

        if (this.infoPlistFile && this.infoPlistFileBak && fs.existsSync(this.infoPlistFileBak)) {
            const infoPlist = fs.readFileSync(this.infoPlistFileBak, 'utf-8');

            if (debugLogging) {
                this.logger.debug(`electron-deeplink: restoring Info.plist`);
            }

            fs.writeFileSync(this.infoPlistFile, infoPlist);
        }
    };

    public getProtocol = () => this.config.protocol;
    public getLogfile = () => {
        return this.logger ? this.logger.transports.file.getFile().path : 'debugLogging is disabled';
    };
}

export { Deeplink };
