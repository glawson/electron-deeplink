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
declare class Deeplink {
    events?: any;
    private appPath?;
    private electronPath?;
    private infoPlistFile?;
    private infoPlistFileBak?;
    private config;
    private logger?;
    constructor(config: DeeplinkConfig);
    private checkConfig;
    private createHandlerApp;
    private emitter;
    restoreInfoPlist: () => void;
    getProtocol: () => string;
    getLogfile: () => any;
}
export { Deeplink };
