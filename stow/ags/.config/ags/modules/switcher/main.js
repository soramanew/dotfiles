const { CenterBox } = Widget;
import PopupWindow from "../.widgethacks/popupwindow.js";
import { Click2CloseRegion } from "../.commonwidgets/click2closeregion.js";
import Switcher from "./switcher.js";

const C2C = () => Click2CloseRegion({ name: "switcher" });

export default () =>
    PopupWindow({
        name: "switcher",
        layer: "overlay",
        keymode: "exclusive",
        visible: false,
        anchor: ["top", "bottom", "left", "right"],
        child: CenterBox({
            startWidget: C2C(),
            centerWidget: CenterBox({
                vertical: true,
                startWidget: C2C(),
                centerWidget: Switcher(),
                endWidget: C2C(),
            }),
            endWidget: C2C(),
        }),
    });
