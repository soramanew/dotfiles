const { Box, CenterBox, Label, Button } = Widget;
import { TodoWidget } from "./todolist.js";
import { setupCursorHover } from "../.widgetutils/cursorhover.js";
import PopupWindow from "../.widgethacks/popupwindow.js";

const Header = () =>
    CenterBox({
        vertical: false,
        startWidget: Box(),
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

export default () =>
    PopupWindow({
        name: "todoscreen",
        layer: "overlay",
        keymode: "exclusive",
        visible: false,
        child: Box({
            vertical: true,
            children: [
                Box({
                    vertical: true,
                    className: "todoscreen-bg spacing-v-15",
                    setup: self => {
                        self.pack_start(Header(), false, false, 0);
                        self.pack_start(TodoWidget(), true, true, 0);
                    },
                }),
            ],
        }),
    });
