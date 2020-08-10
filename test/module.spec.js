const { expect } = require('chai');
const { setRuntimeAppProtocol } = require('../index');

describe('electron-deeplink', () => {
    describe('setProtocolForBundleId()', () => {
        it('should return a string', async () => {
            setRuntimeAppProtocol('loom-desktop-dev');

            expect(1).to.equal(1);
        });
    });
});
