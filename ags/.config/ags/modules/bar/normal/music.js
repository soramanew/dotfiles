import GLib from "gi://GLib";
const { Box, Button, EventBox, Label, Overlay, Revealer } = Widget;
const { execAsync } = Utils;
const Mpris = await Service.import("mpris");
import { AnimatedCircProg } from "../../.commonwidgets/cairo_circularprogress.js";
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import { showMusicControls } from "../../../variables.js";
import { BarGroup } from "./main.js";

function trimTrackTitle(title) {
    if (!title) return "";
    const cleanPatterns = [
        /【[^】]*】/, // Touhou n weeb stuff
        " [FREE DOWNLOAD]", // F-777
    ];
    cleanPatterns.forEach(expr => (title = title.replace(expr, "")));
    return title;
}

const BarGroupMusic = child => BarGroup(child, "music");

const BarResource = (
    name,
    icon,
    command,
    circprogClassName = "bar-batt-circprog",
    textClassName = "txt-onSurfaceVariant",
    iconClassName = "bar-batt"
) => {
    const resourceCircProg = AnimatedCircProg({
        className: circprogClassName,
        vpack: "center",
        hpack: "center",
    });
    const resourceProgress = Box({
        homogeneous: true,
        child: Overlay({
            child: Box({
                vpack: "center",
                className: iconClassName,
                homogeneous: true,
                child: MaterialIcon(icon, "small"),
            }),
            overlays: [resourceCircProg],
        }),
    });
    const resourceLabel = Label({ className: `txt-smallie ${textClassName}` });
    return Box({
        className: `spacing-h-4 ${textClassName}`,
        children: [resourceProgress, resourceLabel],
        setup: self =>
            self.poll(1000, self =>
                execAsync(["bash", "-c", command])
                    .then(output => {
                        output = parseFloat(output);
                        resourceCircProg.css = `font-size: ${output}px;`;
                        resourceLabel.label = `${Math.round(output)}%`;
                        self.tooltipText = `${name}: ${output}%`;
                    })
                    .catch(print)
            ),
    });
};

const BarNetworkRes = (name, icon, command, textClassName = "txt-onSurfaceVariant", iconClassName = "bar-batt") => {
    const resourceProgress = Box({
        vpack: "center",
        className: iconClassName,
        homogeneous: true,
        children: [MaterialIcon(icon, "small")],
    });
    const resourceLabel = Label({ className: `txt-smallie ${textClassName}` });
    return Box({
        className: `spacing-h-4 ${textClassName}`,
        children: [resourceProgress, resourceLabel],
        setup: self =>
            self.poll(5000, self =>
                execAsync(["bash", "-c", command])
                    .then(output => {
                        output = parseInt(output, 10);
                        let unit = "B";
                        if (output > 1048576) {
                            output /= 1048576;
                            unit = "MiB";
                        } else if (output > 1024) {
                            output /= 1024;
                            unit = "kiB";
                        }
                        if (unit !== "B") output = output.toFixed(2);
                        resourceLabel.label = `${output}${unit}/s`;
                        self.tooltipText = `${name}: ${output}${unit}/s`;
                    })
                    .catch(print)
            ),
    });
};

const TrackProgress = () => {
    const updateProgress = circprog => {
        const player = Mpris.getPlayer("");
        if (!player) return;
        // Set circular progress value
        circprog.attribute.updateProgress(circprog, (player.position / player.length) * 100);
    };
    return AnimatedCircProg({
        className: "bar-music-circprog",
        vpack: "center",
        hpack: "center",
        extraSetup: self => self.hook(Mpris, updateProgress).poll(3000, updateProgress),
    });
};

export default () => {
    // TODO: use cairo to make button bounce smaller on click, if that's possible
    const playingState = Box({
        // Wrap a box cuz overlay can't have margins itself
        homogeneous: true,
        children: [
            Overlay({
                child: Box({
                    vpack: "center",
                    className: "bar-music-playstate",
                    homogeneous: true,
                    child: Label({
                        vpack: "center",
                        className: "bar-music-playstate-txt",
                        justification: "center",
                        setup: self =>
                            self.hook(Mpris, label => {
                                label.label =
                                    Mpris.getPlayer("")?.playBackStatus === "Playing" ? "pause" : "play_arrow";
                            }),
                    }),
                }),
                overlays: [TrackProgress()],
            }),
        ],
    });
    const trackTitle = Label({
        hexpand: true,
        className: "txt-smallie bar-music-txt",
        truncate: "end",
        maxWidthChars: 10, // Doesn't matter, just needs to be non negative
        setup: self =>
            self.hook(Mpris, self => {
                const player = Mpris.getPlayer("");
                if (player) {
                    const title = trimTrackTitle(player.trackTitle);
                    self.label = `${title} • ${player.trackArtists.join(", ")}`;
                    const artists = player.trackArtists;
                    const artistsNice =
                        artists.length > 2
                            ? `${artists.slice(0, -1).join(", ")} and ${artists.at(-1)}`
                            : artists.join(", ");
                    self.tooltipText = `${title} by ${artistsNice}`;
                } else {
                    self.label = "No media";
                    self.tooltipText = "";
                }
            }),
    });
    const musicStuff = Box({
        className: "spacing-h-10",
        hexpand: true,
        children: [playingState, trackTitle],
    });
    const systemResources = Box({
        children: [
            BarGroupMusic(
                Box({
                    className: "spacing-h-5",
                    children: [
                        BarNetworkRes(
                            "Upload",
                            "upload",
                            "awk '{if(l1){print $10-l1} else{l1=$10;}}' <(grep wlp0s20f3 /proc/net/dev) <(sleep 1; grep wlp0s20f3 /proc/net/dev)",
                            "bar-upload-txt",
                            "bar-upload-icon"
                        ),
                        BarNetworkRes(
                            "Download",
                            "download",
                            "awk '{if(l1){print $2-l1} else{l1=$2;}}' <(grep wlp0s20f3 /proc/net/dev) <(sleep 1; grep wlp0s20f3 /proc/net/dev)",
                            "bar-download-txt",
                            "bar-download-icon"
                        ),
                    ],
                })
            ),
            BarGroupMusic(
                Box({
                    className: "spacing-h-5",
                    children: [
                        BarResource(
                            "RAM Usage",
                            "memory",
                            `LANG=C free | awk '/^Mem/ {printf("%.2f\\n", ($3/$2) * 100)}'`,
                            "bar-ram-circprog",
                            "bar-ram-txt",
                            "bar-ram-icon"
                        ),
                        BarResource(
                            "Swap Usage",
                            "swap_horiz",
                            `LANG=C free | awk '/^Swap/ {if ($2 > 0) printf("%.2f\\n", ($3/$2) * 100); else print "0";}'`,
                            "bar-swap-circprog",
                            "bar-swap-txt",
                            "bar-swap-icon"
                        ),
                        BarResource(
                            "CPU Usage",
                            "settings_motion_mode",
                            `LANG=C top -bn1 | grep Cpu | sed 's/\\,/\\./g' | awk '{print $2}'`,
                            "bar-cpu-circprog",
                            "bar-cpu-txt",
                            "bar-cpu-icon"
                        ),
                        BarResource(
                            "GPU Usage",
                            "memory_alt",
                            `cat /sys/class/drm/card1/device/gpu_busy_percent`,
                            "bar-gpu-circprog",
                            "bar-gpu-txt",
                            "bar-gpu-icon"
                        ),
                    ],
                })
            ),
        ],
    });
    return Box({
        className: "bar-sidemodule",
        children: [
            systemResources,
            EventBox({
                child: BarGroupMusic(musicStuff),
                onPrimaryClick: () => (showMusicControls.value = !showMusicControls.value),
                onSecondaryClick: () => execAsync("playerctl play-pause").catch(print),
                onMiddleClick: () =>
                    execAsync([
                        "bash",
                        "-c",
                        'playerctl next || playerctl position `bc <<< "100 * $(playerctl metadata mpris:length) / 1000000 / 100"` &',
                    ]).catch(print),
                setup: self =>
                    self.on("button-press-event", (_, event) => {
                        if (event.get_button()[1] === 8)
                            // Side button
                            execAsync("playerctl previous").catch(print);
                    }),
            }),
        ],
    });
};
