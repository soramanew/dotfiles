const { Box, Button } = Widget;
const { exec, readFile, writeFile, HOME } = Utils;
import Wallpaper from "../../../services/wallpaper.js";
import SidebarModule from "./module.js";
import { setupCursorHover } from "../../.widgetutils/cursorhover.js";
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import { COLOUR_MODE_FILE } from "../../../constants.js";
import { updateColourMode } from "../../.miscutils/system.js";

const perfConfPath = `${HOME}/.config/hypr/hyprland/perf.conf`;

const ToggleButton = ({ icon, onClicked, enabled = false, ...rest }) =>
    Button({
        ...rest,
        className: "txt-small sidebar-iconbutton",
        child: MaterialIcon(icon, "norm", { hpack: "center" }),
        attribute: {
            toggled: enabled,
            toggle: self => {
                self.attribute.toggled = !self.attribute.toggled;
                self.toggleClassName("sidebar-button-active", self.attribute.toggled);
                onClicked(self, self.attribute.toggled);
            },
        },
        onClicked: self => self.attribute.toggle(self),
        setup: self => {
            self.toggleClassName("sidebar-button-active", enabled);
            setupCursorHover(self);
        },
    });

const ToggleSetting = ({ setting, icon, inverted = false, ...rest }) => {
    // Commented when enabled
    const isEnabled = () => {
        const perfFileContent = readFile(perfConfPath).split("\n");
        const settingIndex = perfFileContent.findIndex(line => line.includes(`# ## ${setting}`));
        const settingLines = parseInt(perfFileContent[settingIndex].split(" ").at(-1), 10);
        for (let i = settingIndex + 1; i <= settingIndex + settingLines; i++) {
            if (perfFileContent[i].startsWith("#")) {
                if (inverted) return false;
            } else if (!inverted) return false;
        }
        return true;
    };
    return ToggleButton({
        ...rest,
        icon,
        enabled: isEnabled(),
        onClicked: (_, toggled) => {
            const perfFileContent = readFile(perfConfPath).split("\n");
            const settingIndex = perfFileContent.findIndex(line => line.includes(`# ## ${setting}`));
            const settingLines = parseInt(perfFileContent[settingIndex].split(" ").at(-1), 10);
            for (let i = settingIndex + 1; i <= settingIndex + settingLines; i++) {
                if (perfFileContent[i].startsWith("#")) {
                    if (inverted ? toggled : !toggled) perfFileContent[i] = perfFileContent[i].slice(1);
                } else if (inverted ? !toggled : toggled) perfFileContent[i] = `#${perfFileContent[i]}`;
            }
            writeFile(perfFileContent.join("\n"), perfConfPath).catch(print);
        },
    });
};

export default () =>
    SidebarModule({
        icon: MaterialIcon("memory", "norm"),
        name: "Performance settings",
        child: Box({
            hpack: "center",
            className: "sidebar-perftoggles spacing-h-10",
            children: [
                ToggleSetting({
                    setting: "blur",
                    tooltipText: "Blur windows and layers",
                    icon: "deblur",
                }),
                ToggleButton({
                    icon: "opacity",
                    tooltipText: "Transparent shell and terminal",
                    enabled: exec(`sed -n 2p '${COLOUR_MODE_FILE}'`) === "transparent",
                    onClicked: (_, toggled) => updateColourMode(2, toggled ? "transparent" : "opaque"),
                }),
                ToggleSetting({
                    setting: "opacity",
                    tooltipText: "Transparent windows",
                    icon: "select_window_2",
                }),
                ToggleSetting({
                    setting: "animations",
                    tooltipText: "Hyprland animations",
                    icon: "animation",
                }),
                ToggleButton({
                    icon: "wallpaper_slideshow",
                    tooltipText: "Wallpaper slideshow",
                    enabled: Wallpaper.enabled,
                    onClicked: (_, toggled) => (Wallpaper.enabled = toggled),
                }),
                ToggleSetting({
                    setting: "xray",
                    tooltipText: "Xray for blur",
                    icon: "filter_b_and_w",
                }),
            ],
        }),
    });
