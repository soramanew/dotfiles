import Gtk from "gi://Gtk";
const { Box, CenterBox, Label, Button } = Widget;
import Gestures from "./gestures.js";
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
                            label: "Gestures cheat sheet",
                        }),
                        Label({
                            vpack: "center",
                            className: "cheatsheet-key txt-small",
                            label: "Tap",
                        }),
                        Label({
                            vpack: "center",
                            className: "cheatsheet-key txt-small",
                            label: "4",
                        }),
                    ],
                }),
                Label({
                    useMarkup: true,
                    selectable: true,
                    justify: Gtk.Justification.CENTER,
                    className: "txt-small txt",
                    label: "Sheet data stored in <tt>~/.config/ags/modules/gcheatsheet/data_gestures.js</tt>\nChange gestures in <tt>~/.config/hypr/hyprland/plugins.conf</tt>",
                }),
            ],
        }),
        endWidget: Button({
            vpack: "start",
            hpack: "end",
            className: "cheatsheet-closebtn icon-material txt txt-hugeass",
            onClicked: () => App.closeWindow("gcheatsheet"),
            child: Label({
                className: "icon-material txt txt-hugeass",
                label: "close",
            }),
            setup: setupCursorHover,
        }),
    });

const C2C = () => Click2CloseRegion({ name: "gcheatsheet" });

export default () =>
    PopupWindow({
        name: "gcheatsheet",
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
                            children: [Header(), Gestures()],
                        }),
                        C2C(),
                    ],
                }),
                C2C(),
            ],
        }),
    });
