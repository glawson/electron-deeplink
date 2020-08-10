const linkOutput = document.getElementById('link-output');
const protocolOutput = document.getElementsByClassName('protocol');

require('electron').ipcRenderer.on('received-link', (event, link) => {
    linkOutput.innerHTML = link;
});

require('electron').ipcRenderer.on('set-protocol', (event, protocol) => {
    for (let index = 0; index < protocolOutput.length; index++) {
        protocolOutput[index].innerHTML = protocol;
    }
});
