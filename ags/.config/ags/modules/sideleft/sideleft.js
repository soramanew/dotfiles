import Gdk from "gi://Gdk";
const { Box, Button } = Widget;
import { MaterialIcon } from "../.commonwidgets/materialicon.js";
import { setupCursorHover } from "../.widgetutils/cursorhover.js";
import ToolBox from "./toolbox.js";
import { apiWidgets, chatEntry } from "./apiwidgets.js";
import { TabContainer } from "../.commonwidgets/tabcontainer.js";
import { checkKeybind, keybinds } from "../.widgetutils/keybind.js";
import { close, open } from "../click2close/main.js";

const contents = [
    {
        name: "tools",
        content: ToolBox(),
        materialIcon: "home_repair_service",
        friendlyName: "Tools",
    },
    {
        name: "apis",
        content: apiWidgets,
        materialIcon: "api",
        friendlyName: "APIs",
    },
];

export const pinButton = Button({
    attribute: {
        enabled: false,
        toggle: (self, force = null) => {
            self.attribute.enabled = force === null ? !self.attribute.enabled : force;
            self.toggleClassName("sidebar-pin-enabled", self.attribute.enabled);

            const sideleftWindow = App.getWindow("sideleft");
            const sideleftContent = sideleftWindow.child.children[0];
            sideleftContent.toggleClassName("sidebar-pinned", self.attribute.enabled);
            sideleftWindow.exclusivity = self.attribute.enabled ? "exclusive" : "normal";
            if (self.attribute.enabled) close("sideleft");
            else if (force !== false) open("sideleft");
        },
    },
    vpack: "start",
    className: "sidebar-pin",
    child: MaterialIcon("push_pin", "larger"),
    tooltipText: "Pin sidebar (Ctrl+P)",
    onClicked: self => self.attribute.toggle(self),
    setup: self => {
        setupCursorHover(self);
        self.hook(App, (self, currentName, visible) => {
            if (currentName === "sideleft") {
                if (visible) self.grab_focus();
                else if (self.attribute.enabled) self.attribute.toggle(self, false);
            }
        });
    },
});

export const widgetContent = TabContainer({
    icons: contents.map(item => item.materialIcon),
    names: contents.map(item => item.friendlyName),
    children: contents.map(item => item.content),
    className: "sidebar-left spacing-v-10",
    setup: self =>
        self.hook(App, (self, currentName, visible) => {
            if (currentName === "sideleft")
                self.toggleClassName("sidebar-pinned", pinButton.attribute.enabled && visible);
        }),
});

export default () =>
    Box({
        // vertical: true,
        vexpand: true,
        hexpand: true,
        css: "min-width: 2px;",
        children: [widgetContent],
        setup: self =>
            self.on("key-press-event", (widget, event) => {
                // Handle keybinds
                if (checkKeybind(event, keybinds.sidebar.pin)) pinButton.attribute.toggle(pinButton);
                else if (checkKeybind(event, keybinds.sidebar.cycleTab)) widgetContent.cycleTab();
                else if (checkKeybind(event, keybinds.sidebar.nextTab)) widgetContent.nextTab();
                else if (checkKeybind(event, keybinds.sidebar.prevTab)) widgetContent.prevTab();

                if (widgetContent.attribute.names[widgetContent.attribute.shown.value] == "APIs") {
                    // If api tab is focused
                    // Focus entry when typing
                    if (
                        (!(event.get_state()[1] & Gdk.ModifierType.CONTROL_MASK) &&
                            event.get_keyval()[1] >= 32 &&
                            event.get_keyval()[1] <= 126 &&
                            widget != chatEntry &&
                            event.get_keyval()[1] != Gdk.KEY_space) ||
                        (event.get_state()[1] & Gdk.ModifierType.CONTROL_MASK && event.get_keyval()[1] === Gdk.KEY_v)
                    ) {
                        chatEntry.grab_focus();
                        const buffer = chatEntry.get_buffer();
                        buffer.set_text(buffer.text + String.fromCharCode(event.get_keyval()[1]), -1);
                        buffer.place_cursor(buffer.get_iter_at_offset(-1));
                    }
                    // Switch API type
                    else if (checkKeybind(event, keybinds.sidebar.apis.nextTab)) {
                        const toSwitchTab = widgetContent.attribute.children[widgetContent.attribute.shown.value];
                        toSwitchTab.attribute.nextTab();
                    } else if (checkKeybind(event, keybinds.sidebar.apis.prevTab)) {
                        const toSwitchTab = widgetContent.attribute.children[widgetContent.attribute.shown.value];
                        toSwitchTab.attribute.prevTab();
                    }
                }
            }),
    });
