const { Box, CenterBox, Label, Button } = Widget;
import { TodoWidget } from "./todolist.js";
import { setupCursorHover } from "../.widgetutils/cursorhover.js";
import PopupWindow from "../.widgethacks/popupwindow.js";
import { Click2CloseRegion } from "../.commonwidgets/click2closeregion.js";
import { EXTENDED_BAR, SCREEN_HEIGHT, SCREEN_WIDTH } from "../../constants.js";

const Header = () =>
    CenterBox({
        vertical: false,
        centerWidget: Label({
            hpack: "center",
            className: "txt-title txt",
            label: "Todos",
        }),
        endWidget: Button({
            vpack: "start",
            hpack: "end",
            className: "todoscreen-closebtn icon-material txt txt-hugeass",
            onClicked: () => App.closeWindow("todoscreen"),
            child: Label({
                className: "icon-material txt txt-hugeass",
                label: "close",
            }),
            setup: setupCursorHover,
        }),
    });

const C2C = () => Click2CloseRegion({ name: "todoscreen" });

export default () =>
    PopupWindow({
        name: "todoscreen",
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
                    className: "todoscreen-bg spacing-v-15",
                    css: `min-width: ${SCREEN_WIDTH * (EXTENDED_BAR ? 0.68 : 0.75)}px; min-height: ${
                        SCREEN_HEIGHT * 0.75
                    }px;`,
                    setup: self => {
                        self.pack_start(Header(), false, false, 0);
                        self.pack_start(TodoWidget(), true, true, 0);
                    },
                }),
                endWidget: C2C(),
            }),
            endWidget: C2C(),
        }),
    });
