const { Box, CenterBox, Label, Button } = Widget;
import WallpaperPicker from "./wallpicker.js";
import { setupCursorHover } from "../.widgetutils/cursorhover.js";
import PopupWindow from "../.widgethacks/popupwindow.js";
import { Click2CloseRegion } from "../.commonwidgets/click2closeregion.js";

const Header = () =>
    CenterBox({
        vertical: false,
        centerWidget: Label({
            hpack: "center",
            className: "txt-title txt",
            label: "Wallpapers",
        }),
        endWidget: Button({
            vpack: "start",
            hpack: "end",
            className: "wallpicker-close-button icon-material txt txt-hugeass",
            onClicked: () => App.closeWindow("wallpicker"),
            child: Label({
                className: "icon-material txt txt-hugeass",
                label: "close",
            }),
            setup: setupCursorHover,
        }),
    });

const C2C = () => Click2CloseRegion({ name: "wallpicker" });

export default () =>
    PopupWindow({
        name: "wallpicker",
        layer: "overlay",
        keymode: "exclusive",
        visible: false,
        anchor: ["top", "bottom", "left", "right"],
        child: CenterBox({
            startWidget: C2C(),
            centerWidget: CenterBox({
                vertical: true,
                startWidget: C2C(),
                centerWidget: Box({
                    vertical: true,
                    className: "wallpicker-bg spacing-v-15",
                    setup: self => {
                        self.pack_start(Header(), false, false, 0);
                        self.pack_start(WallpaperPicker(), true, true, 0);
                    },
                }),
                endWidget: C2C(),
            }),
            endWidget: C2C(),
        }),
    });
