const { Gdk, Gtk } = imports.gi;
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Service from 'resource:///com/github/Aylur/ags/service.js';
import { Clipboard } from "./clipboard.js";
import { setupCursorHover } from "../.widgetutils/cursorhover.js";

const clipboardHeader = () => Widget.CenterBox({
    vertical: false,
    startWidget: Widget.Box({}),
    centerWidget: Widget.Box({
        hpack: 'center',
        className: 'spacing-h-5',
        children: [
            Widget.Label({
                hpack: 'center',
                css: 'margin-right: 0.682rem;',
                className: 'txt-title txt',
                label: 'Clipboard',
            }),
            Widget.Label({
                vpack: 'center',
                className: "cheatsheet-key txt-small",
                label: "",
            }),
            Widget.Label({
                vpack: 'center',
                className: "cheatsheet-key-notkey txt-small",
                label: "+",
            }),
            Widget.Label({
                vpack: 'center',
                className: "cheatsheet-key txt-small",
                label: "V",
            }),
        ],
    }),
    endWidget: Widget.Button({
        vpack: 'start',
        hpack: 'end',
        className: "cheatsheet-closebtn icon-material txt txt-hugeass",
        onClicked: () => {
            App.toggleWindow('clipboardview');
        },
        child: Widget.Label({
            className: 'icon-material txt txt-hugeass',
            label: 'close'
        }),
        setup: setupCursorHover,
    }),
});

const clickOutsideToClose = Widget.EventBox({
    onPrimaryClick: () => App.closeWindow('clipboardview'),
    onSecondaryClick: () => App.closeWindow('clipboardview'),
    onMiddleClick: () => App.closeWindow('clipboardview'),
});

export default () => Widget.Window({
    name: 'clipboardview',
    exclusivity: 'ignore',
    keymode: 'exclusive',
    popup: true,
    visible: false,
    child: Widget.Box({
        vertical: true,
        children: [
            clickOutsideToClose,
            Widget.Box({
                vertical: true,
                className: "cheatsheet-bg spacing-v-15",
                children: [
                    clipboardHeader(),
                    Clipboard(),
                ]
            }),
        ],
    })
});
