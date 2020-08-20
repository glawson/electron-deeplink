import { argv } from 'process';
import { dirname } from 'path';

const { expect } = require('chai');

const path = require('path');
const EventEmitter = require('events');
const os = require('os');
const fs = require('fs');
const sinon = require('sinon');
const logger = require('electron-log');
const appPath = __dirname;

class App extends EventEmitter {
    constructor() {
        super();
    }
    requestSingleInstanceLock = () => true;
    getAppPath = () => appPath;
    isDefaultProtocolClient = () => false;
    setAsDefaultProtocolClient = () => null;
    quit = () => null;
}
const mainWindowMock = {
    focus: () => null,
    isMinimized: () => true,
    restore: () => null,
};
const eventMock = {
    preventDefault: () => null,
};
const protocol = 'my-test-app';

describe('electron-deeplink', () => {
    let Deeplink: any;

    before(() => {
        const infoPlistPath = `${appPath}/node_modules/electron/dist/Electron.app/Contents`;
        const infoPlist = fs.readFileSync(`${appPath}/Info.plist`, 'utf-8');

        fs.mkdirSync(infoPlistPath, { recursive: true });
        fs.writeFileSync(`${infoPlistPath}/Info.plist`, infoPlist, 'utf-8');

        Deeplink = require('../src/index').Deeplink;
    });

    it('should return an instance of Deeplink', () => {
        const appMock = new App();
        const deeplink = new Deeplink({ app: appMock, mainWindow: mainWindowMock, protocol, isDev: true });

        expect(deeplink).to.be.instanceOf(Deeplink);
    });

    it('should throw missing config error', () => {
        expect(() => {
            return new Deeplink({ isDev: true });
        }).to.throw('electron-deeplink: missing config attributes: app, mainWindow, protocol');
    });

    it('should set debug logging', () => {
        const appMock = new App();
        const spy1 = sinon.spy(logger, 'debug');

        new Deeplink({ app: appMock, mainWindow: mainWindowMock, protocol, isDev: true, debugLogging: true });

        expect(spy1.called).to.equal(true);
    });

    it('should quit due to no lock', () => {
        class AppMock extends App {
            constructor() {
                super();
            }
            requestSingleInstanceLock = () => false;
        }
        const appMock = new AppMock();

        const spy1 = sinon.spy(appMock, 'quit');
        new Deeplink({ app: appMock, mainWindow: mainWindowMock, protocol, isDev: true, debugLogging: true });

        expect(spy1.called).to.equal(true);
    });

    it('should error on app second-instance event if darwin', () => {
        const appMock = new App();
        const spy1 = sinon.spy(logger, 'error');
        const stub1 = sinon.stub(os, 'platform').callsFake(() => 'darwin');

        new Deeplink({ app: appMock, mainWindow: mainWindowMock, protocol, isDev: true, debugLogging: true });

        appMock.emit('second-instance');

        expect(spy1.getCall(0).args[0]).to.equal(
            "electron-deeplink: the app event 'second-instance' fired, this should not of happened, please check your packager bundleId config"
        );

        stub1.restore();
    });

    it('should run mainWidow.focus on app second-instance event', () => {
        const appMock = new App();
        const spy1 = sinon.spy(mainWindowMock, 'isMinimized');
        const spy2 = sinon.spy(mainWindowMock, 'restore');
        const spy3 = sinon.spy(mainWindowMock, 'focus');
        const stub1 = sinon.stub(os, 'platform').callsFake(() => 'win32');

        new Deeplink({ app: appMock, mainWindow: mainWindowMock, protocol, isDev: true, debugLogging: true });

        appMock.emit('second-instance', {}, ['path', 'path', protocol]);

        expect(spy1.called).to.equal(true);
        expect(spy2.called).to.equal(true);
        expect(spy3.called).to.equal(true);

        stub1.restore();
    });

    it('should run openEvent on app open-url event', () => {
        const appMock = new App();
        const deeplink = new Deeplink({ app: appMock, mainWindow: mainWindowMock, protocol, isDev: true, debugLogging: true });
        const spy1 = sinon.spy(deeplink, 'openEvent');

        appMock.emit('will-finish-launching');
        appMock.emit('open-url', eventMock, protocol);

        expect(spy1.called).to.equal(true);
    });

    it('should run setAppProtocol with existing Info.plist', () => {
        const appMock = new App();
        const stub1 = sinon.stub(os, 'platform').callsFake(() => 'darwin');
        const stub2 = sinon.stub(fs, 'existsSync').callsFake(() => true);
        const deeplink = new Deeplink({ app: appMock, mainWindow: mainWindowMock, protocol, isDev: true, debugLogging: false });
        const spy1 = sinon.spy(deeplink, 'setAppProtocol');

        deeplink.setAppProtocol();

        expect(spy1.called).to.equal(true);

        stub1.restore();
        stub2.restore();
    });

    it('should run setAppProtocol with existing Info.deeplink', () => {
        const appMock = new App();
        const stub1 = sinon.stub(os, 'platform').callsFake(() => 'darwin');
        const stub2 = sinon.stub(fs, 'existsSync').callsFake(() => false);
        const deeplink = new Deeplink({ app: appMock, mainWindow: mainWindowMock, protocol, isDev: true, debugLogging: false });
        const spy1 = sinon.spy(deeplink, 'setAppProtocol');

        deeplink.setAppProtocol();

        expect(spy1.called).to.equal(true);

        stub1.restore();
        stub2.restore();
    });

    it('should run restoreInfoPlist and restore Info.plist', () => {
        const appMock = new App();
        const stub1 = sinon.stub(fs, 'readFileSync').callsFake(() => 'Info.plist');
        const stub2 = sinon.stub(fs, 'existsSync').callsFake(() => true);
        const stub3 = sinon.stub(fs, 'writeFileSync').callsFake(() => null);

        const deeplink = new Deeplink({
            app: appMock,
            mainWindow: mainWindowMock,
            protocol,
            isDev: true,
            debugLogging: true,
        });

        const stub4 = sinon.stub(os, 'platform').callsFake(() => 'win32');
        deeplink.restoreInfoPlist();
        stub4.restore();

        const stub5 = sinon.stub(os, 'platform').callsFake(() => 'darwin');
        deeplink.restoreInfoPlist();
        stub5.restore();

        expect(stub1.called).to.equal(true);
        expect(stub2.called).to.equal(true);

        expect(stub3.getCall(1).args[1]).to.equal('Info.plist');

        stub1.restore();
        stub2.restore();
        stub3.restore();
    });

    it('should run getProtocol and return protocol', () => {
        const appMock = new App();

        const deeplink = new Deeplink({
            app: appMock,
            mainWindow: mainWindowMock,
            protocol,
            isDev: true,
            debugLogging: false,
        });

        const results = deeplink.getProtocol();

        expect(results).to.equal(protocol);
    });

    it('should run getLogfile and return file path', () => {
        const appMock = new App();

        const deeplink = new Deeplink({
            app: appMock,
            mainWindow: mainWindowMock,
            protocol,
            isDev: true,
            debugLogging: false,
        });

        const results = deeplink.getLogfile();

        expect(results).to.equal('debugLogging is disabled');
    });
});
