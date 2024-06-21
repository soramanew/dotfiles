const { Box, EventBox, Label, Overlay, Revealer } = Widget;
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
            self.poll(5000, self =>
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
        maxWidthChars: 1,
        setup: self =>
            self.hook(Mpris, self => {
                const player = Mpris.getPlayer("");
                if (player) {
                    const title = trimTrackTitle(player.trackTitle);
                    const artists = player.trackArtists;
                    // Filter to get rid of empty artist names
                    const hasArtists = artists.filter(a => a).length;
                    if (!hasArtists) {
                        self.label = title;
                        self.tooltipText = title;
                    } else {
                        self.label = `${title} • ${artists.join(", ")}`;
                        const artistsNice =
                            artists.length > 2
                                ? `${artists.slice(0, -1).join(", ")} and ${artists.at(-1)}`
                                : artists.join(", ");
                        self.tooltipText = `${title} by ${artistsNice}`;
                    }
                } else {
                    self.label = "No media";
                    self.tooltipText = "";
                }
            }),
    });
    const revealChild = Variable(!Mpris.players.length);
    const musicStuff = Box({
        className: "spacing-h-10",
        hexpand: true,
        children: [playingState, trackTitle],
    });
    const systemResources = EventBox({
        aboveChild: true,
        visibleWindow: false,
        child: BarGroupMusic(
            Box({
                children: [
                    BarResource(
                        "RAM Usage",
                        "memory",
                        `LANG=C free | awk '/^Mem/ {printf("%.2f\\n", ($3/$2) * 100)}'`,
                        "bar-ram-circprog",
                        "bar-ram-txt",
                        "bar-ram-icon"
                    ),
                    Revealer({
                        revealChild: Utils.merge(
                            [revealChild.bind(), Mpris.bind("players")],
                            (reveal, players) => reveal || !players.length
                        ),
                        transition: "slide_left",
                        transitionDuration: 200,
                        child: Box({
                            className: "spacing-h-10 margin-left-10",
                            children: [
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
                            ],
                        }),
                    }),
                ],
            })
        ),
    })
        .on("enter-notify-event", () => (revealChild.value = true))
        .on("leave-notify-event", () => (revealChild.value = false));
    return Box({
        className: "bar-sidemodule",
        children: [
            systemResources,
            EventBox({
                child: BarGroupMusic(musicStuff),
                onHover: () => (revealChild.value = false),
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
                        // Side button
                        if (event.get_button()[1] === 8) execAsync("playerctl previous").catch(print);
                    }),
            }),
        ],
    });
};
