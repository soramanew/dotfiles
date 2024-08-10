import { SCREEN_WIDTH, SCREEN_HEIGHT } from "../../constants.js";

export const Click2CloseRegion = ({ name, expand = true, fill = "", ...rest }) =>
    Widget.EventBox({
        attribute: {
            noFill: self => (self.child.css = "min-width: 0px; min-height: 0px;"),
            fill: self =>
                (self.child.css = `
                    min-width: ${fill.includes("h") ? SCREEN_WIDTH : 0}px;
                    min-height: ${fill.includes("v") ? SCREEN_HEIGHT : 0}px;
                `),
        },
        child: Widget.Box({
            expand,
            css: fill
                ? `
                    min-width: ${fill.includes("h") ? SCREEN_WIDTH : 0}px;
                    min-height: ${fill.includes("v") ? SCREEN_HEIGHT : 0}px;
                `
                : null,
            ...rest,
        }),
        setup: self => self.on("button-press-event", () => App.closeWindow(name)),
    });
