const { Box, Button } = Widget;
const { execAsync, HOME } = Utils;
import { DEFAULT_OSK_LAYOUT, oskLayouts } from "./data_keyboardlayouts.js";
import { hasTouchscreen } from "../.miscutils/system.js";

const keyboardLayout = DEFAULT_OSK_LAYOUT;
const keyboardJson = oskLayouts[keyboardLayout];

function releaseAllKeys() {
    const keycodes = Array.from(Array(249).keys());
    execAsync(["ydotool", "key", ...keycodes.map(keycode => `${keycode}:0`)])
        .then(console.log("[LOG] Osk: Released all keys"))
        .catch(print);
}
class ShiftMode {
    static Off = new ShiftMode("Off");
    static Normal = new ShiftMode("Normal");
    static Locked = new ShiftMode("Locked");

    constructor(name) {
        this.name = name;
    }
    toString() {
        return `ShiftMode.${this.name}`;
    }
}

const WindowButton = (window, icon) =>
    Button({
        className: "osk-control-button txt-norm icon-material",
        label: icon,
        tooltipText: `Toggle ${window}`,
        onClicked: () => App.toggleWindow(window),
    });

const KeyboardControls = () =>
    Box({
        homogeneous: true,
        vertical: true,
        className: "spacing-v-5",
        children: [
            Button({
                className: "osk-control-button txt-norm icon-material",
                onClicked: () => App.closeWindow("osk"),
                label: "keyboard_hide",
                tooltipText: "Close osk",
            }),
            Button({
                className: "osk-control-button txt-norm icon-material",
                label: "keyboard_previous_language",
                tooltipText: "Bring to top",
                onClicked: () => {
                    App.closeWindow("osk");
                    App.openWindow("osk");
                },
            }),
            // Button({
            //     className: "osk-control-button txt-norm",
            //     label: keyboardJson.name_short,
            //     tooltipText: keyboardJson.name,
            // }),
            Button({
                className: "osk-control-button txt-norm icon-material",
                onClicked: () =>
                    execAsync(["bash", "-c", `pkill fuzzel || ${HOME}/.config/fuzzel/scripts/clipboard.sh`]).catch(
                        print
                    ),
                label: "assignment",
                tooltipText: "Toggle clipboard",
            }),
            WindowButton("overview", "overview_key"),
            hasTouchscreen ? WindowButton("applauncher", "apps") : null,
            WindowButton("session", "power_settings_new"),
            WindowButton("todoscreen", "done_outline"),
        ],
    });

const Key = key =>
    Button({
        className: `osk-key osk-key-${key.shape}`,
        hexpand: ["space", "expand"].includes(key.shape),
        label: key.label,
        attribute: { key: key },
        setup: button => {
            let pressed = false;
            allButtons = allButtons.concat(button);
            if (key.keytype == "normal") {
                // mouse down
                button.connect("pressed", () => execAsync(`ydotool key ${key.keycode}:1`).catch(print));
                button.connect("clicked", () => {
                    // release
                    execAsync(`ydotool key ${key.keycode}:0`).catch(print);

                    if (shiftMode == ShiftMode.Normal) {
                        shiftMode = ShiftMode.Off;
                        if (typeof shiftButton !== "undefined") {
                            execAsync(`ydotool key 42:0`).catch(print);
                            shiftButton.toggleClassName("osk-key-active", false);
                        }
                        if (typeof rightShiftButton !== "undefined") {
                            execAsync(`ydotool key 54:0`).catch(print);
                            rightShiftButton.toggleClassName("osk-key-active", false);
                        }
                        allButtons.forEach(button => {
                            if (typeof button.attribute.key.labelShift !== "undefined")
                                button.label = button.attribute.key.label;
                        });
                    }
                });
            } else if (key.keytype == "modkey") {
                button.connect("pressed", () => {
                    // release
                    if (pressed) {
                        execAsync(`ydotool key ${key.keycode}:0`).catch(print);
                        button.toggleClassName("osk-key-active", false);
                        pressed = false;
                        if (key.keycode == 100) {
                            // Alt Gr button
                            allButtons.forEach(button => {
                                if (typeof button.attribute.key.labelAlt !== "undefined")
                                    button.label = button.attribute.key.label;
                            });
                        }
                    } else {
                        execAsync(`ydotool key ${key.keycode}:1`).catch(print);
                        button.toggleClassName("osk-key-active", true);
                        if (!(key.keycode == 42 || key.keycode == 54)) pressed = true;
                        // This toggles the shift button state
                        else
                            switch (shiftMode.name) {
                                case "Off":
                                    {
                                        shiftMode = ShiftMode.Normal;
                                        allButtons.forEach(button => {
                                            if (typeof button.attribute.key.labelShift !== "undefined")
                                                button.label = button.attribute.key.labelShift;
                                        });
                                        if (typeof shiftButton !== "undefined") {
                                            shiftButton.toggleClassName("osk-key-active", true);
                                        }
                                        if (typeof rightShiftButton !== "undefined") {
                                            rightShiftButton.toggleClassName("osk-key-active", true);
                                        }
                                    }
                                    break;
                                case "Normal":
                                    {
                                        shiftMode = ShiftMode.Locked;
                                        if (typeof shiftButton !== "undefined") shiftButton.label = key.labelCaps;
                                        if (typeof rightShiftButton !== "undefined")
                                            rightShiftButton.label = key.labelCaps;
                                    }
                                    break;
                                case "Locked": {
                                    shiftMode = ShiftMode.Off;
                                    if (typeof shiftButton !== "undefined") {
                                        shiftButton.label = key.label;
                                        shiftButton.toggleClassName("osk-key-active", false);
                                    }
                                    if (typeof rightShiftButton !== "undefined") {
                                        rightShiftButton.label = key.label;
                                        rightShiftButton.toggleClassName("osk-key-active", false);
                                    }
                                    execAsync(`ydotool key ${key.keycode}:0`).catch(print);

                                    allButtons.forEach(button => {
                                        if (typeof button.attribute.key.labelShift !== "undefined")
                                            button.label = button.attribute.key.label;
                                    });
                                }
                            }
                        if (key.keycode == 100) {
                            // Alt Gr button
                            allButtons.forEach(button => {
                                if (typeof button.attribute.key.labelAlt !== "undefined")
                                    button.label = button.attribute.key.labelAlt;
                            });
                        }
                        modsPressed = true;
                    }
                });
                if (key.keycode == 42) shiftButton = button;
                else if (key.keycode == 54) rightShiftButton = button;
            }
        },
    });

let shiftMode = ShiftMode.Off;
let shiftButton;
let rightShiftButton;
let allButtons = [];
const KeyboardItself = kbJson => {
    return Box({
        vertical: true,
        className: "spacing-v-5",
        children: kbJson.keys.map(row =>
            Box({
                vertical: false,
                className: "spacing-h-5",
                children: row.map(Key),
            })
        ),
    });
};

export default () =>
    Box({
        vexpand: true,
        hexpand: true,
        vertical: true,
        className: "osk-window spacing-v-5",
        children: [
            Box({
                className: "osk-body spacing-h-10",
                children: [KeyboardControls(), Box({ className: "separator-line" }), KeyboardItself(keyboardJson)],
            }),
        ],
        setup: self =>
            self.hook(App, (_, window, visible) => {
                if (!visible && window === "osk") releaseAllKeys();
            }),
    });
