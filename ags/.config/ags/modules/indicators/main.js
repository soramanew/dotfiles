const { Window, Box } = Widget;
import IndicatorValues from "./indicatorvalues.js";
import MusicControls from "./musiccontrols.js";
import ColorScheme from "./colorscheme.js";
import NotificationPopups from "./notificationpopups.js";
import LockIndicators from "./lockindicators.js";
import Clock from "./clock.js";

export default (monitor = 0) =>
    Window({
        monitor,
        name: `indicator${monitor}`,
        className: "indicator",
        layer: "overlay",
        // exclusivity: 'ignore',
        visible: true,
        anchor: ["top"],
        child: Box({
            vertical: true,
            className: "osd-window",
            // css: "min-height: 2px;",
            children: [
                MusicControls(),
                Clock(),
                ColorScheme(),
                IndicatorValues(),
                LockIndicators(),
                NotificationPopups(),
            ],
        }),
    });
