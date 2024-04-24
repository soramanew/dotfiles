const Battery = await Service.import("battery");
import Workspaces from "./workspaces_hyprland.js";
import { BATTERY_LOW } from "../../../constants.js";

export default () => {
    const contents = Widget.CenterBox({
        className: "bar-bg-focus",
        centerWidget: Workspaces(),
    });
    if (Battery.available)
        contents.hook(
            Battery,
            self => self.toggleClassName("bar-bg-focus-batterylow", Battery.percent <= BATTERY_LOW),
            "notify::percent"
        );
    return contents;
};
