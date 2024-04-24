const { Gdk, Gtk } = imports.gi;
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../variables.js';
import App from 'resource:///com/github/Aylur/ags/app.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';

const { exec, execAsync } = Utils;

const SafeEyesButton = (name, icon, command, props = {}) => {
    const buttonDescription = Widget.Revealer({
        vpack: 'end',
        transitionDuration: 200,
        transition: 'slide_down',
        revealChild: false,
        child: Widget.Label({
            className: 'txt-smaller safeeyes-button-desc',
            label: name,
        }),
    });
    return Widget.Button({
        onClicked: command,
        className: 'safeeyes-button',
        child: Widget.Overlay({
            className: 'safeeyes-button-box',
            child: Widget.Label({
                vexpand: true,
                className: 'icon-material',
                label: icon,
            }),
            overlays: [
                buttonDescription,
            ]
        }),
        onHover: (button) => {
            const display = Gdk.Display.get_default();
            const cursor = Gdk.Cursor.new_from_name(display, 'pointer');
            button.get_window().set_cursor(cursor);
            buttonDescription.revealChild = true;
        },
        onHoverLost: (button) => {
            const display = Gdk.Display.get_default();
            const cursor = Gdk.Cursor.new_from_name(display, 'default');
            button.get_window().set_cursor(cursor);
            buttonDescription.revealChild = false;
        },
        setup: (self) => self
            .on('focus-in-event', (self) => {
                buttonDescription.revealChild = true;
                self.toggleClassName('safeeyes-button-focused', true);
            })
            .on('focus-out-event', (self) => {
                buttonDescription.revealChild = false;
                self.toggleClassName('safeeyes-button-focused', false);
            })
        ,
        ...props,
    });
}

export const prompt = Variable("");
export const breakTimeLeft = Variable(0);

export default () => {
    const closeSafeEyesWindow = () => {
        App.closeWindow("safeeyes");
        execAsync("systemctl --user stop safe-eyes.service");
    };
    const closeButton = SafeEyesButton('Close', 'close', closeSafeEyesWindow, { className: 'safeeyes-button-cancel' });
    return Widget.Box({
        className: "safeeyes-bg",
        css: `
        min-width: ${SCREEN_WIDTH * 1.5}px; 
        min-height: ${SCREEN_HEIGHT * 1.5}px;
        `, // idk why but height = screen height doesn't fill
        vertical: true,
        children: [
            Widget.EventBox({
                onPrimaryClick: closeSafeEyesWindow,
                onSecondaryClick: closeSafeEyesWindow,
                onMiddleClick: closeSafeEyesWindow,
            }),
            Widget.Box({
                hpack: "center",
                vexpand: true,
                vertical: true,
                children: [
                    Widget.Box({
                        vpack: "center",
                        vertical: true,
                        className: "spacing-v-15",
                        children: [
                            Widget.Box({
                                vertical: true,
                                css: "margin-bottom: 0.682rem;",
                                children: [
                                    Widget.Label({
                                        className: "txt-title txt",
                                        label: prompt.bind(),
                                    }),
                                    Widget.Label({
                                        justify: Gtk.Justification.CENTER,
                                        className: "txt-small txt",
                                        label: breakTimeLeft.bind().transform(value => `Time left: ${value}s`),
                                    }),
                                ]
                            }),
                            Widget.Box({
                                hpack: "center",
                                className: "spacing-h-15",
                                children: [
                                    closeButton,
                                ]
                            }),
                        ]
                    })
                ]
            })
        ],
        setup: (self) => self
            .hook(App, (_b, name, visible) => {
                if (visible) closeButton.grab_focus();
            })
        ,
    });
}
