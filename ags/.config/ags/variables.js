const { execAsync, readFile, writeFile } = Utils;
const Mpris = await Service.import("mpris");
import { forMonitors, hasTouchscreen } from "./modules/.miscutils/system.js";
import { LAST_PLAYER_PATH } from "./constants.js";

// Global vars for external control (through keybinds)
export const showMusicControls = Variable(false);
export const showColorScheme = Variable(false);
export const showClock = Variable(false);
globalThis.openMusicControls = showMusicControls;
globalThis.openColorScheme = showColorScheme;
globalThis.openClock = showClock;
globalThis.mpris = Mpris;

// Set as last player on attribute change
Mpris.connect("player-added", (_, busName) => {
    const player = Mpris.getPlayer(busName);
    for (const signal of ["play-back-status", "shuffle-status", "loop-status", "volume"])
        player.connect(`notify::${signal}`, () => {
            writeFile(player.name, LAST_PLAYER_PATH).catch(print);
            lastPlayer.value = player;
        });
});
Mpris.connect("player-closed", (_, busName) => {
    // If player closed is the controlled player, set last player to another player in preference of playing > paused > stopped
    if (busName === lastPlayer.value?.busName) {
        const player =
            Mpris.players.find(p => p.playBackStatus === "Playing") ||
            Mpris.players.find(p => p.playBackStatus === "Paused") ||
            Mpris.getPlayer();
        if (player) writeFile(player.name, LAST_PLAYER_PATH).catch(print);
        else execAsync(["rm", LAST_PLAYER_PATH]).catch(print); // If no player then remove file
        lastPlayer.value = player;
    }
});
export const lastPlayer = Variable();
// Set value after timeout cause Mpris needs time to load or something
Utils.timeout(500, () => (lastPlayer.value = Mpris.getPlayer(readFile(LAST_PLAYER_PATH))));

// Mode switching
export const currentShellMode = Variable("normal"); // normal, focus
globalThis.currentMode = currentShellMode;
globalThis.cycleMode = () => {
    if (currentShellMode.value === "normal") currentShellMode.value = "focus";
    else currentShellMode.value = "normal";
};

// Window controls
globalThis.toggleWindowOnAllMonitors = name => forMonitors(id => App.toggleWindow(name + id));
globalThis.closeWindowOnAllMonitors = name => forMonitors(id => App.closeWindow(name + id));
globalThis.openWindowOnAllMonitors = name => forMonitors(id => App.openWindow(name + id));

globalThis.closeEverything = () => {
    App.closeWindow("cheatsheet");
    if (hasTouchscreen) App.closeWindow("gcheatsheet");
    App.closeWindow("session");
    App.closeWindow("todoscreen");
    App.closeWindow("sideleft");
    App.closeWindow("sideright");
    App.closeWindow("overview");
};

export const tabletMode = Variable(false);
globalThis.tabletMode = tabletMode;

// For lock indicators (isCapsLockOn and isNumLockOn global for external script control)
const showIndicatorsFn = (indicator, timeout = 1000) => {
    let currentIndicatorTimeout;
    return () => {
        indicator.value = true;
        if (currentIndicatorTimeout) currentIndicatorTimeout.destroy();
        currentIndicatorTimeout = setTimeout(() => {
            indicator.value = false;
        }, timeout);
    };
};

export const showLockIndicators = Variable(false);
export const isCapsLockOn = Variable(readFile("/sys/class/leds/input7::capslock/brightness").trim() === "1");
export const isNumLockOn = Variable(readFile("/sys/class/leds/input7::numlock/brightness").trim() === "1");
const showLockIndicatorsFn = showIndicatorsFn(showLockIndicators);
isCapsLockOn.connect("changed", showLockIndicatorsFn);
isNumLockOn.connect("changed", showLockIndicatorsFn);
globalThis.isCapsLockOn = isCapsLockOn;
globalThis.isNumLockOn = isNumLockOn;
