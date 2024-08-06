"use strict";
// Import
const { exec, execAsync } = Utils;
const Battery = await Service.import("battery");
import { forMonitors, hasTouchscreen } from "./modules/.miscutils/system.js";
import { COMPILED_STYLE_DIR } from "./constants.js";
// Widgets
import Bar, { BarCornerTopleft, BarCornerTopright } from "./modules/bar/main.js";
import Cheatsheet from "./modules/cheatsheet/main.js";
import Corner from "./modules/screencorners/main.js";
import Indicator from "./modules/indicators/main.js";
import Osk from "./modules/onscreenkeyboard/main.js";
import Overview from "./modules/overview/main.js";
import Session from "./modules/session/main.js";
import SideLeft from "./modules/sideleft/main.js";
import SideRight from "./modules/sideright/main.js";
import TodoScreen from "./modules/todoscreen/main.js";
import AppLauncher from "./modules/applauncher/main.js";
import GCheatsheet from "./modules/gcheatsheet/main.js";
import Switcher from "./modules/switcher/main.js";

// SCSS compilation
export function applyStyle() {
    exec(`mkdir -p ${COMPILED_STYLE_DIR}`);
    exec(`sass ${App.configDir}/scss/main.scss ${COMPILED_STYLE_DIR}/style.css`);
    App.resetCss();
    App.applyCss(`${COMPILED_STYLE_DIR}/style.css`);
    console.log("[LOG] Styles loaded");
}
// Global for external control
globalThis.reloadCss = applyStyle;
applyStyle();

// Battery low notifications
const BATTERY_SLEEP_LEVEL = 3;
const BATTERY_WARN_LEVELS = [20, 15, 5];
const BATTERY_WARN_TITLES = ["Low battery", "Very low battery", "Critical Battery"];
const BATTERY_WARN_BODIES = ["Plug in the charger", "You there?", "PLUG THE CHARGER ALREADY"];
const batteryWarned = [false, false, false];
function batteryMessage() {
    if (Battery.charging) {
        for (let i = 0; i < batteryWarned.length; i++) batteryWarned[i] = false;
        return;
    }
    const perc = Battery.percent;
    if (perc <= BATTERY_SLEEP_LEVEL) {
        execAsync([
            "notify-send",
            "-u",
            "critical",
            "-t",
            "4000",
            "-a",
            "ags",
            "CRITICAL BATTERY",
            "Hibernating to prevent data loss...",
        ]).catch(print);
        Utils.timeout(4000, () => execAsync("systemctl hibernate").catch(print));
        return;
    }
    for (let i = BATTERY_WARN_LEVELS.length - 1; i >= 0; i--) {
        if (perc <= BATTERY_WARN_LEVELS[i] && !batteryWarned[i]) {
            for (let j = i; j >= 0; j--) batteryWarned[j] = true;
            execAsync([
                "notify-send",
                "-u",
                "critical",
                "-t",
                "8000",
                "-a",
                "ags",
                BATTERY_WARN_TITLES[i],
                BATTERY_WARN_BODIES[i],
            ]).catch(print);
            break;
        }
    }
}
if (Battery.available) Battery.connect("changed", batteryMessage);

const Windows = () => [
    Overview(),
    Switcher(),
    Cheatsheet(),
    hasTouchscreen ? [AppLauncher(), GCheatsheet()] : [],
    TodoScreen(),
    SideLeft(),
    SideRight(),
    Osk(),
    Session(),
    forMonitors(Bar),
    forMonitors(BarCornerTopleft),
    forMonitors(BarCornerTopright),
    forMonitors(Indicator),
    forMonitors(id => Corner(id, "top left")),
    forMonitors(id => Corner(id, "top right")),
    forMonitors(id => Corner(id, "bottom left")),
    forMonitors(id => Corner(id, "bottom right")),
];

App.addIcons(`${App.configDir}/assets/icons`);
App.config({
    css: `${COMPILED_STYLE_DIR}/style.css`,
    stackTraceOnError: true,
    windows: Windows().flat(1),
});
