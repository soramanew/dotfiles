const { Box } = Widget;
import { RoundedScrollable } from "../.commonwidgets/cairo_roundedscrollable.js";
import QuickScripts from "./tools/quickscripts.js";
import ColorPicker from "./tools/colorpicker.js";
import PerfToggles from "./tools/perftoggles.js";
import PackageUpdates from "./tools/packageupdates.js";
import Timer from "./tools/timer.js";

export default () =>
    RoundedScrollable({
        hscroll: "never",
        vscroll: "automatic",
        overlayClass: "sidebar-scrollcorner0",
        child: Box({
            vertical: true,
            className: "spacing-v-10",
            children: [QuickScripts(), PerfToggles(), ColorPicker(), PackageUpdates(), Timer()],
        }),
    });
