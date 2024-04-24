const { Gdk } = imports.gi;

export const keybinds = {
    overview: {
        altMoveLeft: "Ctrl+b",
        altMoveRight: "Ctrl+f",
        deleteToEnd: "Ctrl+k",
    },
    sidebar: {
        apis: {
            nextTab: "Page_Down",
            prevTab: "Page_Up",
        },
        options: {
            // Right sidebar
            nextTab: "Page_Down",
            prevTab: "Page_Up",
        },
        pin: "Ctrl+p",
        cycleTab: "Ctrl+Tab",
        nextTab: "Ctrl+Page_Down",
        prevTab: "Ctrl+Page_Up",
    },
};

const MODS = {
    Shift: Gdk.ModifierType.SHIFT_MASK,
    Ctrl: Gdk.ModifierType.CONTROL_MASK,
    Alt: Gdk.ModifierType.ALT_MASK,
    Hyper: Gdk.ModifierType.HYPER_MASK,
    Meta: Gdk.ModifierType.META_MASK,
};

export const checkKeybind = (event, keybind) => {
    const pressedModMask = event.get_state()[1];
    const pressedKey = event.get_keyval()[1];
    const keys = keybind.split("+");
    for (let i = 0; i < keys.length; i++) {
        if (keys[i] in MODS) {
            if (!(pressedModMask & MODS[keys[i]])) {
                return false;
            }
        } else if (pressedKey !== Gdk[`KEY_${keys[i]}`]) {
            return false;
        }
    }
    return true;
};
