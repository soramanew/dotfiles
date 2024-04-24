"use strict";
// Import
const { GLib } = imports.gi;
const { exec, notify } = Utils;
const Battery = await Service.import("battery");
import { forMonitors } from "./modules/.miscutils/system.js";
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
import Click2Close from "./modules/click2close/main.js";
import TodoScreen from "./modules/todoscreen/main.js";
import AppLauncher from "./modules/applauncher/main.js";
import GCheatsheet from "./modules/gcheatsheet/main.js";

const COMPILED_STYLE_DIR = `${GLib.get_user_cache_dir()}/ags/user/generated`;

// SCSS compilation
exec(`bash -c 'echo "" > ${App.configDir}/scss/_musicwal.scss'`); // reset music styles
exec(`bash -c 'echo "" > ${App.configDir}/scss/_musicmaterial.scss'`); // reset music styles
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
    for (let i = BATTERY_WARN_LEVELS.length - 1; i >= 0; i--) {
        if (perc <= BATTERY_WARN_LEVELS[i] && !batteryWarned[i]) {
            for (let j = i; j >= 0; j--) batteryWarned[j] = true;
            notify({
                summary: BATTERY_WARN_TITLES[i],
                body: BATTERY_WARN_BODIES[i],
                urgency: "critical",
                appName: "ags",
            }).catch(print);
            break;
        }
    }
}
Battery.connect("changed", batteryMessage);

const Windows = () => [
    Overview(),
    forMonitors(Indicator),
    forMonitors(Cheatsheet),
    forMonitors(GCheatsheet),
    TodoScreen(),
    SideLeft(),
    SideRight(),
    Osk(),
    Session(),
    forMonitors(id => Corner(id, "top left")),
    forMonitors(id => Corner(id, "top right")),
    forMonitors(id => Corner(id, "bottom left")),
    forMonitors(id => Corner(id, "bottom right")),
    forMonitors(Bar),
    forMonitors(BarCornerTopleft),
    forMonitors(BarCornerTopright),
    forMonitors(Click2Close),
    AppLauncher(),
];

App.config({
    css: `${COMPILED_STYLE_DIR}/style.css`,
    stackTraceOnError: true,
    windows: Windows().flat(1),
    icons: `${App.configDir}/assets/icons`,
});
