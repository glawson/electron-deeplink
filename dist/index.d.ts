declare const EventEmitter: any;
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
    private openEvent;
    restoreInfoPlist: () => void;
    getProtocol: () => string | null;
    getLogfile: () => any;
}
export { Deeplink };
