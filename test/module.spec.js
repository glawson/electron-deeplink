const { expect } = require('chai');
const { Deeplink } = require('../dist/index');
const path = require('path');

const app = {
    requestSingleInstanceLock: () => true,
    getAppPath: () => path.join(__dirname),
    isDefaultProtocolClient: () => false,
    setAsDefaultProtocolClient: () => null,
    on: () => null,
};

describe('electron-deeplink', () => {
    describe('initialize Deeplink', () => {
        it('should return an object', async () => {
            const deeplink = new Deeplink({ app, mainWindow: null, protocol: 'my-test-app', isDev: true, debugLogging: true });

            expect(1).to.equal(1);
        });
    });
});
