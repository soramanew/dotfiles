const Battery = await Service.import("battery");
const Hyprland = await Service.import("hyprland");
import Workspaces from "./workspaces_hyprland.js";
import { BATTERY_LOW } from "../../../constants.js";
import { dispatch } from "../../.miscutils/system.js";

const scrollWs = prefix => {
    const activeWs = JSON.parse(Hyprland.message("j/activewindow")).workspace?.name;
    if (activeWs?.startsWith("special:")) dispatch(`togglespecialworkspace ${activeWs.replace("special:", "")}`);
    else dispatch(`workspace ${prefix}1`);
};

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
    return Widget.EventBox({
        onScrollUp: () => scrollWs("-"),
        onScrollDown: () => scrollWs("+"),
        onSecondaryClickRelease: cycleMode,
        onMiddleClickRelease: () => App.toggleWindow("overview"),
        child: contents,
    });
};
