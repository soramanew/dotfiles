const { Box, CenterBox, EventBox } = Widget;
const Hyprland = await Service.import("hyprland");
const Audio = await Service.import("audio");
import Workspaces from "./workspaces_hyprland.js";
import WindowTitle from "./spaceleft.js";
import Indicators from "./spaceright.js";
import Music from "./music.js";
import System from "./system.js";
import Brightness from "../../../services/brightness.js";
import { dispatch } from "../../.miscutils/system.js";

export const BarGroup = (child, module) =>
    Box({
        className: "bar-group-margin bar-sides",
        child: Box({
            className: `bar-group bar-group-pad-${module}`,
            child,
        }),
    });

const SpaceLeft = () =>
    EventBox({
        hexpand: true,
        onScrollUp: () => (Brightness.screen_value += 0.05),
        onScrollDown: () => (Brightness.screen_value -= 0.05),
        onPrimaryClickRelease: () => App.toggleWindow("sideleft"),
        onMiddleClickRelease: () => App.toggleWindow("overview"),
        child: WindowTitle(),
    });

const SpaceRight = () =>
    EventBox({
        hexpand: true,
        onScrollUp: () => {
            if (Audio.speaker) Audio.speaker.volume = Math.min(Audio.speaker.volume + 0.05, 1);
        },
        onScrollDown: () => {
            if (Audio.speaker) Audio.speaker.volume -= 0.05;
        },
        onPrimaryClickRelease: () => App.toggleWindow("sideright"),
        onMiddleClickRelease: () => App.toggleWindow("overview"),
        child: Indicators(),
    });

const CenterModules = () =>
    EventBox({
        onScrollUp: () => dispatch("workspace -1"),
        onScrollDown: () => {
            const activeWs = JSON.parse(Hyprland.message("j/activewindow")).workspace?.name;
            if (activeWs?.startsWith("special:"))
                dispatch(`togglespecialworkspace ${activeWs.replace("special:", "")}`);
            else dispatch("workspace +1");
        },
        child: CenterBox({
            startWidget: Music(),
            centerWidget: Workspaces(),
            endWidget: System(),
        }),
    });

export default () =>
    CenterBox({
        className: "bar-bg",
        startWidget: SpaceLeft(),
        centerWidget: CenterModules(),
        endWidget: SpaceRight(),
    });
