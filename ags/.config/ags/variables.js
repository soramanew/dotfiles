const { exec } = Utils;
const Mpris = await Service.import("mpris");
import { forMonitors } from "./modules/.miscutils/system.js";
import { pinButton } from "./modules/sideleft/sideleft.js";

// Global vars for external control (through keybinds)
export const showMusicControls = Variable(false, {});
export const showColorScheme = Variable(false, {});
globalThis.openMusicControls = showMusicControls;
globalThis.openColorScheme = showColorScheme;
globalThis.mpris = Mpris;

// Screen size
export const SCREEN_WIDTH = Number(
    exec(
        `bash -c "xrandr --current | grep '*' | uniq | awk '{print $1}' | cut -d 'x' -f1 | head -1" | awk '{print $1}'`
    )
);
export const SCREEN_HEIGHT = Number(
    exec(
        `bash -c "xrandr --current | grep '*' | uniq | awk '{print $1}' | cut -d 'x' -f2 | head -1" | awk '{print $1}'`
    )
);

// Mode switching
export const currentShellMode = Variable("normal", {}); // normal, focus
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
    closeWindowOnAllMonitors("cheatsheet");
    closeWindowOnAllMonitors("click2close");
    if (!pinButton.attribute.enabled) App.closeWindow("sideleft");
    App.closeWindow("sideright");
    App.closeWindow("overview");
    App.closeWindow("session");
    App.closeWindow("todoscreen");
    closeWindowOnAllMonitors("gcheatsheet");
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
export const isCapsLockOn = Variable(false);
export const isNumLockOn = Variable(false);
const showLockIndicatorsFn = showIndicatorsFn(showLockIndicators);
isCapsLockOn.connect("changed", showLockIndicatorsFn);
isNumLockOn.connect("changed", showLockIndicatorsFn);
globalThis.isCapsLockOn = isCapsLockOn;
globalThis.isNumLockOn = isNumLockOn;
