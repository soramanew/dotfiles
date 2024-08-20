const { exec } = Utils;
const Mpris = await Service.import("mpris");
import { COLOUR_MODE_FILE } from "./constants.js";
import { forMonitors, hasTouchscreen, updateColourMode } from "./modules/.miscutils/system.js";

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

// Global vars for external control (through keybinds)
export const musicControlsMode = Variable(0); // 0 -> show none ; 1 -> show osd + cava ; 2 -> only show cava
globalThis.musicControlsMode = musicControlsMode;
export const showColorScheme = Variable(false);
const showColourSchemeFn = showIndicatorsFn(showColorScheme, 3000);
showColorScheme.connect("changed", () => {
    if (showColorScheme.value) showColourSchemeFn();
});
globalThis.openColourScheme = () => showColorScheme.setValue(true); // setValue to force changed signal
globalThis.mpris = Mpris;

// Mode switching
export const currentShellMode = Variable("normal"); // normal, focus
globalThis.currentMode = currentShellMode;
globalThis.cycleMode = () => {
    if (currentShellMode.value === "normal") currentShellMode.value = "focus";
    else currentShellMode.value = "normal";
};

// Tablet mode (triggered via acpi events, need external script to trigger)
export const tabletMode = Variable(false);
globalThis.tabletMode = tabletMode;

// Dark mode
export const darkMode = Variable(exec(`sed -n 1p '${COLOUR_MODE_FILE}'`) !== "light");
darkMode.connect("changed", ({ value }) => updateColourMode(1, value ? "dark" : "light"));

// For lock indicators (isCapsLockOn and isNumLockOn global for external script control)
export const showLockIndicators = Variable(false);
export const isCapsLockOn = Variable(exec("bash -c 'cat /sys/class/leds/input*::capslock/brightness'").includes("1"));
export const isNumLockOn = Variable(exec("bash -c 'cat /sys/class/leds/input*::numlock/brightness'").includes("1"));
const showLockIndicatorsFn = showIndicatorsFn(showLockIndicators);
isCapsLockOn.connect("changed", showLockIndicatorsFn);
isNumLockOn.connect("changed", showLockIndicatorsFn);
const updateLockIndicatorFn = (indicator, name) => () =>
    indicator.setValue(exec(`bash -c 'cat /sys/class/leds/input*::${name}lock/brightness'`).includes("1"));
globalThis.updateCapsLock = updateLockIndicatorFn(isCapsLockOn, "caps");
globalThis.updateNumLock = updateLockIndicatorFn(isNumLockOn, "num");

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
    App.closeWindow("switcher");
};
