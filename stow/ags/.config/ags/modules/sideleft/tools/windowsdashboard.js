const { Box, Button } = Widget;
import SidebarModule from "./module.js";
import { setupCursorHover } from "../../.widgetutils/cursorhover.js";
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";

const WindowButton = (icon, name, tooltip) =>
    Button({
        tooltipText: tooltip,
        className: "txt-small sidebar-iconbutton",
        child: MaterialIcon(icon, "norm", { hpack: "center" }),
        onClicked: () => App.toggleWindow(name),
        setup: self => {
            setupCursorHover(self);
            self.toggleClassName("sidebar-button-active", false);
            self.hook(
                App,
                (_, wname, visible) => {
                    if (wname === name) self.toggleClassName("sidebar-button-active", visible);
                },
                "window-toggled"
            );
        },
    });

export default () =>
    SidebarModule({
        icon: MaterialIcon("widgets", "norm"),
        name: "Windows dashboard",
        child: Box({
            hpack: "center",
            className: "sidebar-perftoggles spacing-h-10",
            children: [
                WindowButton("overview_key", "overview", "Overview"),
                WindowButton("dock_to_right", "sideleft", "Utilities sidebar"),
                WindowButton("dock_to_left", "sideright", "System sidebar"),
                WindowButton("settings_power", "session", "Power menu"),
                WindowButton("keyboard_command_key", "cheatsheet", "Cheat sheet"),
                WindowButton("checklist", "todoscreen", "Todo list"),
                WindowButton("wallpaper", "wallpicker", "Wallpaper picker"),
                WindowButton("keyboard_onscreen", "osk", "Virtual keyboard"),
            ],
        }),
    });
