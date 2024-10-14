const { Box, Button, Label } = Widget;
import { MaterialIcon } from "../.commonwidgets/materialicon.js";
import { setupCursorHover } from "../.widgetutils/cursorhover.js";
import { checkKeybind, keybinds } from "../.widgetutils/keybind.js";
import { Click2CloseRegion } from "../.commonwidgets/click2closeregion.js";
import QuickScripts from "./tools/quickscripts.js";
import ColourPicker from "./tools/colorpicker.js";
import PerfToggles from "./tools/perftoggles.js";
import PackageUpdates from "./tools/packageupdates.js";
import Timer from "./tools/timer.js";
import WindowsDashboard from "./tools/windowsdashboard.js";
import GradientScrollable from "../.commonwidgets/gradientscrollable.js";

export default () => {
    const click2Close = Click2CloseRegion({ name: "sideleft", fill: "h" });
    const pinButton = Button({
        attribute: {
            enabled: false,
            toggle: (self, force = null) => {
                self.attribute.enabled = force === null ? !self.attribute.enabled : force;
                self.toggleClassName("sidebar-pin-enabled", self.attribute.enabled);

                const sideleftWindow = App.getWindow("sideleft");
                const sideleftContent = sideleftWindow.child.children[0];
                sideleftContent.toggleClassName("sidebar-pinned", self.attribute.enabled);
                if (self.attribute.enabled) click2Close.attribute.noFill(click2Close);
                else click2Close.attribute.fill(click2Close);
                sideleftWindow.exclusivity = self.attribute.enabled ? "exclusive" : "normal";
            },
        },
        vpack: "start",
        className: "sidebar-pin",
        child: MaterialIcon("push_pin", "large"),
        tooltipText: "Pin sidebar (Ctrl+P)",
        onClicked: self => self.attribute.toggle(self),
        setup: setupCursorHover,
    });
    return Box({
        vexpand: true,
        children: [
            Box({
                vertical: true,
                className: "sidebar-left spacing-v-10",
                children: [
                    Box({
                        className: "spacing-h-5",
                        children: [
                            Box({ hexpand: true }),
                            MaterialIcon("home_repair_service", "larger"),
                            Label({ className: "txt txt-large", label: "Toolbox" }),
                            Box({ hexpand: true }),
                            pinButton,
                        ],
                    }),
                    GradientScrollable({
                        vexpand: true,
                        child: Box({
                            vertical: true,
                            className: "spacing-v-10",
                            children: [
                                QuickScripts(),
                                WindowsDashboard(),
                                PerfToggles(),
                                ColourPicker(),
                                PackageUpdates(),
                                Timer(),
                            ],
                        }),
                    }),
                ],
            }),
            click2Close,
        ],
        setup: self =>
            self.on("key-press-event", (_, event) => {
                // Handle keybinds
                if (checkKeybind(event, keybinds.sidebar.pin)) pinButton.attribute.toggle(pinButton);
            }),
    });
};
