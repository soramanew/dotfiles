"use strict";
// Import
const { exec } = Utils;
import { forMonitors } from "./modules/.miscutils/system.js";
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

const Windows = () => [
    Overview(),
    AppLauncher(),
    Cheatsheet(),
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
