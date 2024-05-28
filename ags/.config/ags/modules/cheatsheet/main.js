import Gtk from "gi://Gtk";
const { Box, CenterBox, Label, Button } = Widget;
import Keybinds from "./keybinds.js";
import { setupCursorHover } from "../.widgetutils/cursorhover.js";
import PopupWindow from "../.widgethacks/popupwindow.js";
import { Click2CloseRegion } from "../.commonwidgets/click2closeregion.js";

const Header = () =>
    CenterBox({
        vertical: false,
        centerWidget: Box({
            vertical: true,
            className: "spacing-h-15",
            children: [
                Box({
                    hpack: "center",
                    className: "spacing-h-5",
                    children: [
                        Label({
                            hpack: "center",
                            css: "margin-right: 0.682rem;",
                            className: "txt-title txt",
                            label: "Cheat sheet",
                        }),
                        Label({
                            vpack: "center",
                            className: "cheatsheet-key txt-small",
                            label: "",
                        }),
                        Label({
                            vpack: "center",
                            className: "cheatsheet-key-notkey txt-small",
                            label: "+",
                        }),
                        Label({
                            vpack: "center",
                            className: "cheatsheet-key txt-small",
                            label: "/",
                        }),
                    ],
                }),
                Label({
                    useMarkup: true,
                    selectable: true,
                    justify: Gtk.Justification.CENTER,
                    className: "txt-small txt",
                    label: "Sheet data stored in <tt>~/.config/ags/modules/cheatsheet/data_keybinds.js</tt>\nChange keybinds in <tt>~/.config/hypr/hyprland/keybinds.conf</tt>",
                }),
            ],
        }),
        endWidget: Button({
            vpack: "start",
            hpack: "end",
            className: "cheatsheet-closebtn icon-material txt txt-hugeass",
            onClicked: () => App.closeWindow("cheatsheet"),
            child: Label({
                className: "icon-material txt txt-hugeass",
                label: "close",
            }),
            setup: setupCursorHover,
        }),
    });

const C2C = () => Click2CloseRegion({ name: "cheatsheet" });

export default () =>
    PopupWindow({
        name: "cheatsheet",
        layer: "overlay",
        keymode: "on-demand",
        visible: false,
        anchor: ["top", "bottom", "left", "right"],
        child: Box({
            vertical: true,
            children: [
                C2C(),
                Box({
                    vexpand: false,
                    children: [
                        C2C(),
                        Box({
                            vertical: true,
                            className: "cheatsheet-bg spacing-v-15",
                            children: [Header(), Keybinds()],
                        }),
                        C2C(),
                    ],
                }),
                C2C(),
            ],
        }),
    });
