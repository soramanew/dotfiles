import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../../constants.js";
import { showMusicControls } from "../../variables.js";
import PopupWindow from "../.widgethacks/popupwindow.js";
import { enableClickthrough } from "../.widgetutils/clickthrough.js";
import Cava from "./cava.js";

export default (monitor = 0) =>
    PopupWindow({
        monitor,
        name: `cava${monitor}`,
        anchor: ["bottom"],
        child: Cava({ width: SCREEN_WIDTH, barHeight: SCREEN_HEIGHT * 0.3 }),
        setup: self => {
            enableClickthrough(self);
            self.hook(showMusicControls, () => (self.visible = showMusicControls.value));
        },
    });
