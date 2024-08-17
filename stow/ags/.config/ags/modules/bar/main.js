const { Box, Window, Stack, Revealer } = Widget;
import NormalBar from "./normal/main.js";
import FocusBar from "./focus/main.js";
import { enableClickthrough } from "../.widgetutils/clickthrough.js";
import { RoundedCorner } from "../.commonwidgets/cairo_roundedcorner.js";
import { currentShellMode } from "../../variables.js";

const MODE_TRANSITION_LENGTH = 200;

export default (monitor = 0) =>
    Window({
        monitor,
        name: `bar${monitor}`,
        anchor: ["top", "left", "right"],
        exclusivity: "exclusive",
        visible: true,
        child: Stack({
            transition: "slide_up_down",
            transitionDuration: MODE_TRANSITION_LENGTH,
            children: {
                normal: Revealer({
                    transition: "slide_down",
                    transitionDuration: MODE_TRANSITION_LENGTH,
                    revealChild: currentShellMode.bind().as(mode => mode === "normal"),
                    child: NormalBar(),
                }),
                focus: FocusBar(),
            },
            shown: currentShellMode.bind(),
        }),
    });

const BarCorner = (monitor, where) =>
    Window({
        monitor,
        name: `barcorner${where
            .split(" ")
            .map(c => c[0])
            .join("")}${monitor}`,
        layer: "top",
        anchor: where.split(" "),
        exclusivity: "ignore",
        visible: true,
        child: Box({
            child: RoundedCorner(where.replaceAll(/\s/g, ""), { className: "corner" }),
            setup: self => {
                Utils.timeout(
                    MODE_TRANSITION_LENGTH,
                    () => (self.css = `margin-top: ${App.getWindow(`bar${monitor}`).get_size()[1]}px;`)
                );
                self.hook(currentShellMode, self => {
                    const ANIM_POINTS = 10;
                    const TRANSITION_PER_POINT = MODE_TRANSITION_LENGTH / ANIM_POINTS;
                    for (let i = 1; i <= ANIM_POINTS; i++)
                        Utils.timeout(
                            TRANSITION_PER_POINT * i,
                            () => (self.css = `margin-top: ${App.getWindow(`bar${monitor}`).get_size()[1]}px;`)
                        );
                });
            },
        }),
        setup: enableClickthrough,
    });

export const BarCornerTopleft = (monitor = 0) => BarCorner(monitor, "top left");
export const BarCornerTopright = (monitor = 0) => BarCorner(monitor, "top right");
