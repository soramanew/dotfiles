const { Window, Box, Overlay } = Widget;
import { background, CACHE_DIR } from "./lib.js";
import TimeDate from "./modules/timedate.js";
import Session from "./modules/session.js";
import Auth from "./modules/auth.js";

const win = Window({
    name: "greeter",
    anchor: ["top", "left", "right", "bottom"],
    keymode: "exclusive",
    child: Overlay({
        passThrough: true,
        child: Box({
            expand: true,
            className: "background",
            css: `background-image: url("${background}");`,
        }),
        overlays: [TimeDate(), Session(), Auth()],
    }),
});

Utils.exec(
    `bash -c '${App.configDir}/scripts/generate_colors_material.py --path "${background}" > ${CACHE_DIR}/_material.scss'`
);
Utils.exec(`sass -I ${CACHE_DIR} ${App.configDir}/scss/main.scss ${CACHE_DIR}/style.css`);
App.config({ style: `${CACHE_DIR}/style.css`, cursorTheme: "sweet-cursors", windows: [win] });
