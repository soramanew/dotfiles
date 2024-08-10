import SessionScreen from "./sessionscreen.js";
import PopupWindow from "../.widgethacks/popupwindow.js";

export default () =>
    PopupWindow({
        name: "session",
        visible: false,
        keymode: "on-demand",
        layer: "overlay",
        exclusivity: "ignore",
        anchor: ["top", "bottom", "left", "right"],
        child: SessionScreen(),
    });
