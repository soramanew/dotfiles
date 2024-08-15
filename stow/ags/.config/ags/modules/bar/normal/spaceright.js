const { Box, EventBox, Revealer } = Widget;
import Tray, { SystemTray } from "./tray.js";
import { StatusIcons } from "../../.commonwidgets/statusicons.js";

const SeparatorDot = () =>
    Revealer({
        transition: "slide_left",
        child: Box({ vpack: "center", className: "separator-circle" }),
        setup: self => {
            const update = () => (self.revealChild = SystemTray.get_items().length > 0);
            update();
            self.hook(SystemTray, update, "item_added");
            self.hook(SystemTray, update, "item_removed");
        },
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
