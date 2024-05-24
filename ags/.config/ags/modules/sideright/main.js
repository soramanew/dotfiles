import { Click2CloseRegion } from "../.commonwidgets/click2closeregion.js";
import PopupWindow from "../.widgethacks/popupwindow.js";
import SidebarRight from "./sideright.js";

export default () =>
    PopupWindow({
        name: "sideright",
        keymode: "on-demand",
        anchor: ["right", "top", "bottom"],
        layer: "overlay",
        child: Widget.Box({ children: [Click2CloseRegion({ name: "sideright", fill: "h" }), SidebarRight()] }),
    });
