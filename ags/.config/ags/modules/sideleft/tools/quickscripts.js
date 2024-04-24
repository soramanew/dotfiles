const { GLib } = imports.gi;
const { Box, Button, Icon, Label } = Widget;
const { exec, execAsync } = Utils;
import Wallpaper from "../../../services/wallpaper.js";
import SidebarModule from "./module.js";
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import { setupCursorHover } from "../../.widgetutils/cursorhover.js";
import { distroID, isArchDistro, isDebianDistro, hasFlatpak } from "../../.miscutils/system.js";

const changeWallpaperScript = `${GLib.get_home_dir()}/.config/hypr/scripts/wallpaper-change.sh`;

const scripts = [
    {
        icon: "nixos-symbolic",
        name: "Trim system generations to 5",
        command: `sudo ${App.configDir}/scripts/quickscripts/nixos-trim-generations.sh 5 0 system`,
        enabled: distroID == "nixos",
    },
    {
        icon: "nixos-symbolic",
        name: "Trim home manager generations to 5",
        command: `${App.configDir}/scripts/quickscripts/nixos-trim-generations.sh 5 0 home-manager`,
        enabled: distroID == "nixos",
    },
    {
        icon: "ubuntu-symbolic",
        name: "Update packages",
        command: `sudo apt update && sudo apt upgrade -y`,
        enabled: isDebianDistro,
    },
    {
        icon: "fedora-symbolic",
        name: "Update packages",
        command: `sudo dnf upgrade -y`,
        enabled: distroID == "fedora",
    },
    {
        icon: "arch-symbolic",
        name: "Update packages",
        command: `yay`,
        enabled: isArchDistro,
    },
    {
        icon: "flatpak-symbolic",
        name: "Uninstall unused flatpak packages",
        command: `flatpak uninstall --unused`,
        enabled: hasFlatpak,
    },
    {
        icon: "wallpaper-symbolic",
        name: Wallpaper.bind("next-exec").as(time => "Change wallpaper" + (time ? ` - Next change at ${time}` : "")),
        command: () => Wallpaper.oneshot(),
        enabled: true,
    },
    {
        icon: "arch-symbolic",
        name: Variable("Update pacman mirrors", {
            poll: [
                60000,
                `${App.configDir}/scripts/quickscripts/get-last-updated-mirrorlist.sh`,
                out => `Update pacman mirrors\n - last updated ${out} ago`,
            ],
        }).bind(),
        command:
            "sudo true; set TMPFILE $(mktemp); rate-mirrors --save=$TMPFILE arch --max-delay=21600 && sudo mv /etc/pacman.d/mirrorlist /etc/pacman.d/mirrorlist-backup && sudo mv $TMPFILE /etc/pacman.d/mirrorlist",
        enabled: true,
    },
    {
        icon: "linux-symbolic",
        name: "Update firmware", // - " + (exec("fwupdmgr get-updates").split("\n").at(-1) === "No updates available" ? "No updates!" : "Updates available"),
        command: "fwupdmgr refresh; fwupdmgr update",
        enabled: true,
    },
];

const QuickScript = ({ icon, name, command }) => {
    const stateIcon = Variable("not_started");
    let timeout;
    stateIcon.connect("changed", self => {
        timeout?.destroy();
        timeout = setTimeout(() => (self.value = "not_started"), 3000);
    });
    return Box({
        className: "spacing-h-5 txt",
        children: [
            Icon({
                className: "sidebar-module-btn-icon txt-large",
                icon: icon,
            }),
            Label({
                className: "txt-small",
                hpack: "start",
                hexpand: true,
                label: name,
                tooltipText: typeof command === "function" ? command.name : command,
            }),
            Button({
                className: "sidebar-module-scripts-button",
                child: MaterialIcon(stateIcon.bind(), "norm"),
                onClicked: () => {
                    if (typeof command === "function") {
                        command();
                        stateIcon.value = "done";
                    } else {
                        closeEverything();
                        execAsync(["foot", "-T", "quickscript", "fish", "-C", command])
                            .then(() => (stateIcon.value = "done"))
                            .catch(print);
                    }
                },
                setup: setupCursorHover,
            }),
        ],
    });
};

export default () =>
    SidebarModule({
        icon: MaterialIcon("code", "norm"),
        name: "Quick scripts",
        child: Box({
            vertical: true,
            className: "spacing-v-5",
            children: scripts.filter(script => script.enabled).map(QuickScript),
        }),
    });
