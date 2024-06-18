import Gtk from "gi://Gtk";
const { Box, Revealer, Button, Overlay, Label } = Widget;
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../../constants.js";
import { setupCursorHover } from "../.widgetutils/cursorhover.js";

const SessionButtonRow = children =>
    Box({
        hpack: "center",
        className: "spacing-h-15",
        children: children,
    });

export default (id = "") => {
    const SessionButton = ({ name, icon, command = null, colourId = 0, extraClassName = "", ...rest }) => {
        const buttonDescription = Revealer({
            vpack: "end",
            transitionDuration: 150,
            transition: "slide_down",
            revealChild: false,
            child: Label({
                className: "txt-smaller session-button-desc",
                label: name,
            }),
        });
        const go = (self, yes) => {
            buttonDescription.revealChild = yes;
            self.toggleClassName("session-button-focused", yes);
        };
        return Button({
            onClicked: () => {
                App.closeWindow(`session${id}`);
                if (command) Utils.execAsync(command).catch(print);
            },
            className: `session-button session-colour-${colourId} ${extraClassName}`,
            child: Overlay({
                className: "session-button-box",
                child: Label({
                    vexpand: true,
                    className: "icon-material",
                    label: icon,
                }),
                overlays: [buttonDescription],
            }),
            setup: self =>
                setupCursorHover(
                    self
                        .on("enter-notify-event", self => go(self, true))
                        .on("leave-notify-event", self => go(self, false))
                        .on("focus-in-event", self => go(self, true))
                        .on("focus-out-event", self => go(self, false))
                ),
            ...rest,
        });
    };
    // lock, logout, sleep
    const lockButton = SessionButton({
        name: "Lock",
        icon: "lock",
        command: ["loginctl", "lock-session"],
        colourId: 1,
    });
    const logoutButton = SessionButton({
        name: "Logout",
        icon: "logout",
        command: ["bash", "-c", "hyprctl dispatch exit || loginctl terminate-user $USER"],
        colourId: 2,
    });
    const sleepButton = SessionButton({
        name: "Sleep",
        icon: "sleep",
        command: ["bash", "-c", "systemctl suspend-then-hibernate || loginctl suspend"],
        colourId: 3,
    });
    // hibernate, shutdown, reboot
    const hibernateButton = SessionButton({
        name: "Hibernate",
        icon: "downloading",
        command: ["bash", "-c", "systemctl hibernate || loginctl hibernate"],
        colourId: 4,
    });
    const shutdownButton = SessionButton({
        name: "Shutdown",
        icon: "power_settings_new",
        command: ["bash", "-c", "systemctl poweroff || loginctl poweroff"],
        colourId: 5,
    });
    const rebootButton = SessionButton({
        name: "Reboot",
        icon: "restart_alt",
        command: ["bash", "-c", "systemctl reboot || loginctl reboot"],
        colourId: 6,
    });
    const cancelButton = SessionButton({
        name: "Cancel",
        icon: "close",
        extraClassName: "session-button-cancel",
        colourId: 7,
    });

    const sessionDescription = Box({
        vertical: true,
        css: "margin-bottom: 0.682rem;",
        children: [
            Label({
                className: "txt-title txt",
                label: "Session",
            }),
            Label({
                justify: Gtk.Justification.CENTER,
                className: "txt-small txt",
                label: "Use arrow keys to navigate.\nEnter to select, Esc to cancel.",
            }),
        ],
    });
    const sessionButtonRows = [
        SessionButtonRow([lockButton, logoutButton, sleepButton]),
        SessionButtonRow([hibernateButton, shutdownButton, rebootButton]),
        SessionButtonRow([cancelButton]),
    ];
    return Box({
        className: "session-bg",
        css: `
            min-width: ${SCREEN_WIDTH}px;
            min-height: ${SCREEN_HEIGHT}px;
        `,
        vertical: true,
        children: [
            Box({
                hpack: "center",
                vexpand: true,
                vertical: true,
                children: [
                    Box({
                        vpack: "center",
                        vertical: true,
                        className: "spacing-v-15",
                        children: [sessionDescription, ...sessionButtonRows],
                    }),
                ],
            }),
        ],
        setup: self =>
            self.hook(App, (_, __, visible) => {
                if (visible) lockButton.grab_focus(); // Lock is the default option
            }),
    });
};
