/// <reference types="node" />
import { App, BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
interface DeeplinkConfig {
    protocol: string;
    app: App;
    mainWindow: BrowserWindow;
    isDev?: boolean;
    debugLogging?: boolean;
    electronPath?: string;
}
declare class Deeplink extends EventEmitter {
    private appPath?;
    private electronPath?;
    private infoPlistFile?;
    private infoPlistFileBak?;
    private logger?;
    private app;
    private mainWindow;
    private config;
    constructor(config: DeeplinkConfig);
    private checkConfig;
    private setAppProtocol;
    private secondInstanceEvent;
    private darwinOpenEvent;
    restoreInfoPlist: () => void;
    getProtocol: () => string;
    getLogfile: () => any;
}
export { Deeplink };
