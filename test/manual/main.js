/* globals WSMonkey, SnapDriver, EnsureUndo */
/* eslint-disable no-console, no-unused-vars */

const frames = Array.prototype.slice.call(document.getElementsByTagName('iframe'));
const toolbar = document.getElementsByTagName('footer')[0];
var driver = null,
    monkey = new WSMonkey();

// TODO: Add module for ensuring actions are undo-able
EnsureUndo.init(toolbar);

frames.forEach(frame => {
    const url = window.location.href.replace(window.location.pathname, '');
    frame.setAttribute('src', url);
});

let ig = null;
function startTests() {
    const windows = frames.map(frame => frame.contentWindow);
    //EnsureUndo.register(windows);
    return frames  // FIXME: Nothing here is async...
        .reduce((promise, frame) => {
            return promise.then(() => {
                driver = new SnapDriver(frame.contentWindow.world);
                driver.setWindow(frame.contentWindow);
                ig = InteractionGenerator(driver);
                monkey.setWorld(frame.contentWindow.world); // update the world view for our monkey
            });
        }, Promise.resolve())
        .then(() => {
            onIframesReady();
        });
}

function checkLoaded() {
    const allLoaded = frames.reduce((isLoaded, frame) => {
        return isLoaded && !!frame.contentWindow.world;
    }, true);

    if (allLoaded) {
        startTests();
    } else {
        setTimeout(checkLoaded, 10);
    }
}

window.onload = () => {
    fitIframes();
    checkLoaded();
};

// computes the appropriate height for iframes
// handles one iframe for now
function fitIframes() {
    let idealHeight = window.innerHeight - document.getElementById('footer').clientHeight;
    frames[0].style.height = idealHeight;
}

const interactions = [];
async function onIframesReady() {
    console.log('all iframes ready');
    document.body.style.visibility = 'visible';
    while (1) {
        //try {
            interactions.push(await ig());
        //} catch (err) {
            //console.error(err);
            //console.error(`Found a bug!`);
            //console.log(JSON.stringify(interactions));
            // TODO: Save the error list
        //}
        console.log(interactions[interactions.length-1]);
        await driver.sleep(250);
    }
}

const connectionStatus = document.getElementById("connection-status");
monkey.onStateChange = connected => {
    if (connected) {
        connectionStatus.classList.remove('red');
        connectionStatus.classList.add('green');
    } else {
        connectionStatus.classList.remove('green');
        connectionStatus.classList.add('red');
    }
};

const connectionProfile = document.getElementById("websocket-connection");
connectionProfile.onchange = function() {
    const profile = connectionProfile.value;

    monkey.stopPlaying();
    if (profile === 'online') {
        monkey.connect();
    } else if (profile === 'offline') {
        monkey.disconnect();
    } else {
        monkey.startPlaying();
    }
};
