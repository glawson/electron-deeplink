const electronDeeplink = require('bindings')('electron-deeplink.node');
const path = require('path');
const fs = require('fs');
const os = require('os');
const EventEmitter = require('events');
const { infoPlistTemplate } = require('./templates');

interface EventHandler {
    (event: Event, args: string): void;
}

interface FuncBool {
    (param?: any): boolean;
}

interface FuncVoid {
    (param?: any): void;
}

interface FuncString {
    (param?: any): string;
}

interface On {
    (event: string, callback: EventHandler): void;
}

interface App {
    requestSingleInstanceLock: FuncBool;
    isDefaultProtocolClient: FuncBool;
    setAsDefaultProtocolClient: FuncVoid;
    quit: FuncVoid;
    on: On;
    getAppPath: FuncString;
}

interface MainWindow {
    isMinimized: FuncBool;
    restore: FuncVoid;
    focus: FuncVoid;
}

interface DeeplinkConfig {
    protocol: string;
    app: App;
    mainWindow: MainWindow;
    isDev?: boolean;
    isYarn?: boolean;
    debugLogging?: boolean;
}

class Deeplink {
    public events?: any;
    private appPath?: string;
    private electronPath?: string;
    private infoPlistFile?: string;
    private infoPlistFileBak?: string;
    private config: DeeplinkConfig;
    private logger?: any;

    constructor(config: DeeplinkConfig) {
        const { app, mainWindow, protocol, isDev = false, debugLogging = false } = config;

        this.config = { app, mainWindow, protocol, isDev, debugLogging };
        this.checkConfig();

        if (debugLogging) {
            this.logger = require('electron-log');
            this.logger.transports.file.level = 'debug';
            this.logger.debug(`electron-deeplink: debugLogging is enabled`);
        }

        const instanceLock = app.requestSingleInstanceLock();

        if (!instanceLock) {
            if (debugLogging) {
                this.logger.debug(`electron-deeplink: unable to lock instance`);
            }
            app.quit();
            return;
        }

        this.events = new EventEmitter();

        if (isDev) {
            const handlerDebug = this.createHandlerApp();

            if (debugLogging) {
                Object.keys(handlerDebug).forEach((key) => {
                    this.logger.debug(
                        `electron-deeplink: HANDLER: ${key}: ${Array.isArray(handlerDebug[key]) ? JSON.stringify(handlerDebug[key]) : handlerDebug[key]}`
                    );
                });
            }
        }

        if (!app.isDefaultProtocolClient(protocol)) {
            app.setAsDefaultProtocolClient(protocol);
        }

        app.on('second-instance', (event, args) => {
            // handle windows here

            if (!this.config) {
                return;
            }

            if (this.config.mainWindow.isMinimized()) {
                this.config.mainWindow.restore();
            }
            this.config.mainWindow.focus();
        });

        app.on('will-finish-launching', () => {
            app.on('open-url', (event, url) => this.emitter(event, url, 'open-url'));
            app.on('open-file', (event, url) => this.emitter(event, url, 'open-file'));
        });
    }

    private checkConfig = () => {
        const expectedKeys = ['app', 'mainWindow', 'protocol'];
        const configKeys = Object.keys(this.config);

        const missingKeys = expectedKeys.filter((expectedKey) => {
            return !configKeys.includes(expectedKey);
        });

        if (missingKeys.length > 0) {
            throw Error(`electron-deeplink: missing config attributes: ${missingKeys.join(', ')}`);
        }
    };

    private createHandlerApp = () => {
        const { app, protocol, debugLogging } = this.config;

        if (os.platform() !== 'darwin') {
            return;
        }

        const bundleURL = infoPlistTemplate.replace(/{PROTOCOL}/g, protocol);
        let infoPlist;

        this.appPath = app.getAppPath();
        this.electronPath = path.join(this.appPath, '/node_modules/electron/dist/Electron.app');
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

    private emitter = (event: any, url: string, eventName: string) => {
        event.preventDefault();
        const { debugLogging } = this.config;

        if (debugLogging) {
            this.logger.debug(`electron-deeplink: ${eventName}: ${url}`);
        }

        if (this.events) {
            this.events.emit('received', url);
        }
    };

    public restoreInfoPlist = () => {
        const { debugLogging, isDev } = this.config;

        if (!isDev || os.platform() !== 'darwin') {
            return;
        }

        if (fs.existsSync(this.infoPlistFileBak)) {
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
