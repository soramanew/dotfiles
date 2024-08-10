const { Window, Box } = Widget;
import IndicatorValues from "./indicatorvalues.js";
import MusicControls from "./musiccontrols.js";
import ColourScheme from "./colourscheme.js";
import NotificationPopups from "./notificationpopups.js";
import LockIndicators from "./lockindicators.js";

export default (monitor = 0) =>
    Window({
        monitor,
        name: `indicator${monitor}`,
        className: "indicator",
        layer: "overlay",
        visible: true,
        anchor: ["top"],
        child: Box({
            vertical: true,
            className: "osd-window",
            children: [MusicControls(), ColourScheme(), IndicatorValues(), LockIndicators(), NotificationPopups()],
        }),
    });
