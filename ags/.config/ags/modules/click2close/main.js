const { Box, EventBox } = Widget;
import PopupWindow from "../.widgethacks/popupwindow.js";
import { forMonitors } from "../.miscutils/system.js";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../../variables.js";

const CLICK2CLOSE_MATCH_REGEX = [/^sideleft$/, /^sideright$/, /^overview$/, /^g?cheatsheet[0-9]+$/, /^todoscreen$/];
const checkWindowRelevance = currentName => CLICK2CLOSE_MATCH_REGEX.some(regex => regex.test(currentName));

const openWindows = {};
export const open = window => {
    openWindows[window] = true;
    forMonitors(id => App.openWindow(`click2close${id}`));
};
export const close = window => {
    openWindows[window] = false;
    if (!Object.values(openWindows).some(w => w)) forMonitors(id => App.closeWindow(`click2close${id}`));
};

App.connect("window-toggled", (_, name, visible) => {
    if (checkWindowRelevance(name)) {
        if (visible) open(name);
        else close(name);
    }
});

export default monitor =>
    PopupWindow({
        monitor,
        name: `click2close${monitor}`,
        layer: "top",
        anchor: ["top", "bottom", "left", "right"],
        exclusivity: "ignore",
        child: EventBox({
            onPrimaryClick: closeEverything,
            onSecondaryClick: closeEverything,
            onMiddleClick: closeEverything,
            child: Box({
                css: `
                    background-color: rgba(0,0,0,0.2);
                    min-height: ${SCREEN_HEIGHT}px;
                    min-width: ${SCREEN_WIDTH}px;
                `,
            }),
        }),
    });
