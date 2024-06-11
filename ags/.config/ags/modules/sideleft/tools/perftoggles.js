import GLib from "gi://GLib";
const { execAsync, readFile, writeFile } = Utils;
const { Box, Button } = Widget;
import Wallpaper from "../../../services/wallpaper.js";
import SidebarModule from "./module.js";
import { setupCursorHover } from "../../.widgetutils/cursorhover.js";
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import { applyStyle } from "../../../config.js";
import { CACHE_DIR } from "../../../constants.js";

const confDir = `${GLib.get_home_dir()}/.config`;
const perfConfPath = `${confDir}/hypr/hyprland/perf.conf`;

const ToggleButton = ({ icon, onClicked, enabled = false, tooltip, extraSetup = () => {}, ...rest }) =>
    Button({
        ...rest,
        className: "txt-small sidebar-iconbutton",
        tooltipText: `${enabled ? "Disable" : "Enable"} ${tooltip}`,
        child: MaterialIcon(icon, "norm", { hpack: "center" }),
        attribute: {
            toggled: enabled,
            toggle: self => {
                self.attribute.toggled = !self.attribute.toggled;
                self.toggleClassName("sidebar-button-active", self.attribute.toggled);
                self.tooltipText = `${self.attribute.toggled ? "Disable" : "Enable"} ${tooltip}`;
                onClicked(self, self.attribute.toggled);
            },
        },
        onClicked: self => self.attribute.toggle(self),
        setup: self => {
            self.toggleClassName("sidebar-button-active", enabled);
            setupCursorHover(self);
            extraSetup(self);
        },
    });

const ToggleSetting = ({ setting, tooltip, icon, inverted = false, extraFn = () => {}, ...rest }) => {
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
        tooltip,
        enabled: isEnabled(),
        onClicked: (self, toggled) => {
            const perfFileContent = readFile(perfConfPath).split("\n");
            const settingIndex = perfFileContent.findIndex(line => line.includes(`# ## ${setting}`));
            const settingLines = parseInt(perfFileContent[settingIndex].split(" ").at(-1), 10);
            for (let i = settingIndex + 1; i <= settingIndex + settingLines; i++) {
                if (perfFileContent[i].startsWith("#")) {
                    if (inverted ? toggled : !toggled) perfFileContent[i] = perfFileContent[i].slice(1);
                } else if (inverted ? !toggled : toggled) perfFileContent[i] = `#${perfFileContent[i]}`;
            }
            writeFile(perfFileContent.join("\n"), perfConfPath).catch(print);
            extraFn(self, toggled);
        },
    });
};

export default () =>
    SidebarModule({
        icon: MaterialIcon("memory", "norm"),
        name: "Performance settings",
        child: Box({
            vertical: true,
            className: "spacing-v-5",
            child: Box({
                hpack: "center",
                className: "sidebar-togglesbox spacing-h-10",
                children: [
                    ToggleSetting({
                        setting: "blur",
                        tooltip: "blur for everything",
                        icon: "deblur",
                    }),
                    ToggleSetting({
                        setting: "opacity",
                        tooltip: "opacity for everything",
                        icon: "opacity",
                        extraFn: (_, toggled) =>
                            execAsync([
                                `bash`,
                                `-c`,
                                `mkdir -p ${CACHE_DIR}/user && sed -i "2s/.*/${
                                    toggled ? "transparent" : "opaque"
                                }/"  ${CACHE_DIR}/user/colormode.txt`,
                            ])
                                .then(
                                    execAsync([
                                        "bash",
                                        "-c",
                                        `${App.configDir}/scripts/color_generation/switchcolor.sh`,
                                    ]).catch(print)
                                )
                                .catch(print),
                    }),
                    ToggleSetting({
                        setting: "animations",
                        tooltip: "all animations",
                        icon: "animation",
                    }),
                    ToggleSetting({
                        setting: "borderanim",
                        tooltip: "border gradient animation",
                        icon: "border_color",
                    }),
                    ToggleButton({
                        icon: "wallpaper_slideshow",
                        tooltip: "wallpaper slideshow",
                        enabled: Wallpaper.enabled,
                        onClicked: (_, toggled) => (Wallpaper.enabled = toggled),
                    }),
                    ToggleSetting({
                        setting: "xray",
                        tooltip: "xray for blur",
                        icon: "filter_b_and_w",
                    }),
                ],
            }),
        }),
    });
