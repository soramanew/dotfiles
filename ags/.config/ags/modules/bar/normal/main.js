const { Box, CenterBox, EventBox } = Widget;
const Hyprland = await Service.import("hyprland");
const Audio = await Service.import("audio");
import Workspaces from "./workspaces_hyprland.js";
import WindowTitle from "./spaceleft.js";
import Indicators from "./spaceright.js";
import Music from "./music.js";
import System from "./system.js";
import Brightness from "../../../services/brightness.js";

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
        onPrimaryClick: () => App.toggleWindow("sideleft"),
        // onSecondaryClick: () => App.toggleWindow("overview"),
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
        onPrimaryClick: () => App.toggleWindow("sideright"),
        // onSecondaryClick: () => App.toggleWindow("overview"),
        child: Indicators(),
    });

const CenterModules = () =>
    EventBox({
        onScrollUp: () => Hyprland.messageAsync("dispatch workspace -1").catch(print),
        onScrollDown: () => Hyprland.messageAsync("dispatch workspace +1").catch(print),
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
