const { Box, EventBox, Revealer } = Widget;
const SystemTray = await Service.import("systemtray");
import { StatusIcons } from "../../.commonwidgets/statusicons.js";
import Tray from "./tray.js";

const SeparatorDot = () =>
    Revealer({
        transition: "slide_left",
        revealChild: SystemTray.bind("items").as(items => items.length > 0),
        child: Box({ vpack: "center", className: "separator-circle" }),
    });

export default () => {
    const statusIcons = EventBox({
        aboveChild: true,
        visibleWindow: false,
        child: StatusIcons({
            className: "bar-statusicons",
            setup: self =>
                self.hook(App, (self, currentName, visible) => {
                    if (currentName === "sideright") self.toggleClassName("bar-statusicons-active", visible);
                }),
        }),
    })
        .on("enter-notify-event", self => self.child.toggleClassName("bar-statusicons-active", true))
        .on("leave-notify-event", self => {
            if (!App.getWindow("sideright").visible) self.child.toggleClassName("bar-statusicons-active", false);
        });
    const actualContent = Box({
        hexpand: true,
        className: "spacing-h-5 bar-spaceright",
        children: [Box({ hexpand: true }), Tray(), SeparatorDot(), statusIcons],
    });

    return Box({ children: [actualContent, Box({ className: "bar-corner-spacing" })] });
};
