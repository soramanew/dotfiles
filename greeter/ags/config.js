import Gdk from "gi://Gdk";
const { Window, Box, Overlay } = Widget;
import { background, CACHE_DIR } from "./lib.js";
import TimeDate from "./modules/timedate.js";
import Session from "./modules/session.js";
import Auth from "./modules/auth.js";

const auth = Auth();

const win = Window({
    name: "greeter",
    anchor: ["top", "left", "right", "bottom"],
    exclusivity: "ignore",
    keymode: "exclusive",
    child: Overlay({
        passThrough: true,
        child: Box({
            expand: true,
            className: "background",
            css: `background-image: url("${background}");`,
        }),
        overlays: [TimeDate(), Session(), auth],
        setup: self =>
            self.on("key-press-event", (widget, event) => {
                const keyval = event.get_keyval()[1];
                const modstate = event.get_state()[1];
                if (!(modstate & Gdk.ModifierType.CONTROL_MASK)) {
                    // Ctrl not held
                    if (keyval >= 32 && keyval <= 126 && widget != auth.attribute) {
                        auth.attribute.grab_focus();
                        auth.attribute.set_text(auth.attribute.text + String.fromCharCode(keyval));
                        auth.attribute.set_position(-1);
                    }
                }
            }),
    }),
});

Utils.exec(
    `bash -c '${App.configDir}/scripts/generate_colors_material.py --path "${background}" > ${CACHE_DIR}/_material.scss'`
);
Utils.exec(`sass -I ${CACHE_DIR} ${App.configDir}/scss/main.scss ${CACHE_DIR}/style.css`);
App.config({ style: `${CACHE_DIR}/style.css`, cursorTheme: "sweet-cursors", windows: [win] });
