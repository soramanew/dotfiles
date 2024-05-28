import { Click2CloseRegion } from "../.commonwidgets/click2closeregion.js";
import PopupWindow from "../.widgethacks/popupwindow.js";
import SearchAndWindows from "./windowcontent.js";

export default () =>
    PopupWindow({
        name: "overview",
        exclusivity: "ignore",
        keymode: "on-demand",
        visible: false,
        anchor: ["top", "bottom", "left", "right"],
        layer: "overlay",
        child: Widget.Box({
            vertical: true,
            children: [
                Click2CloseRegion({ name: "overview", expand: false, className: "overview-top-space" }),
                SearchAndWindows(),
            ],
        }),
    });
