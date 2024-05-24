import PopupWindow from "../.widgethacks/popupwindow.js";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../../constants.js";
import AppLauncher, { close } from "./applauncher.js";

export default () => {
    const launcher = AppLauncher();
    return PopupWindow({
        name: `applauncher`,
        layer: "overlay",
        keymode: "exclusive",
        anchor: ["top", "bottom", "left", "right"],
        exclusivity: "ignore",
        escFn: () => close(launcher),
        child: Widget.EventBox({
            onPrimaryClick: () => close(launcher),
            onSecondaryClick: () => close(launcher),
            onMiddleClick: () => close(launcher),
            child: Widget.Box({
                className: "applauncher-bg",
                css: `
                    min-height: ${SCREEN_HEIGHT}px;
                    min-width: ${SCREEN_WIDTH}px;
                `,
                setup: self => self.set_center_widget(launcher),
            }),
        }),
    });
};
