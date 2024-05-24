import PopupWindow from "../.widgethacks/popupwindow.js";
import SearchAndWindows from "./windowcontent.js";

export default (id = "") =>
    PopupWindow({
        name: `overview${id}`,
        exclusivity: "ignore",
        keymode: "on-demand",
        visible: false,
        anchor: ["top", "bottom"],
        layer: "overlay",
        child: Widget.EventBox({
            onPrimaryClick: closeEverything,
            // onSecondaryClick: closeEverything,
            onMiddleClick: closeEverything,
            child: SearchAndWindows(),
        }),
    });
