const { Box, EventBox, Label, Button, Revealer, Overlay } = Widget;
const { execAsync } = Utils;
const Mpris = await Service.import("mpris");
import { fileExists } from "../.miscutils/files.js";
import { AnimatedCircProg } from "../.commonwidgets/cairo_circularprogress.js";
import { showMusicControls } from "../../variables.js";
import { hasPlasmaIntegration, inPath } from "../.miscutils/system.js";
import { clamp } from "../.miscutils/mathfuncs.js";
import Players from "../../services/players.js";

function isRealPlayer(player) {
    return (
        player &&
        // Remove unecessary native buses from browsers if there's plasma integration
        !(hasPlasmaIntegration && player.busName.startsWith("org.mpris.MediaPlayer2.firefox")) &&
        !(hasPlasmaIntegration && player.busName.startsWith("org.mpris.MediaPlayer2.chromium")) &&
        // playerctld just copies other buses and we don't need duplicates
        !player.busName.startsWith("org.mpris.MediaPlayer2.playerctld") &&
        // Non-instance mpd bus
        !(player.busName.endsWith(".mpd") && !player.busName.endsWith("MediaPlayer2.mpd"))
    );
}

function lengthStr(length) {
    const min = Math.floor(length / 60);
    const sec = Math.floor(length % 60);
    const sec0 = sec < 10 ? "0" : "";
    return `${min}:${sec0}${sec}`;
}

const DEFAULT_MUSIC_FONT = "Gabarito, sans-serif";
function getTrackfont(player) {
    const title = player.trackTitle;
    const artists = player.trackArtists.join(" ");
    if (artists.includes("TANO*C") || artists.includes("USAO") || artists.includes("Kobaryo")) return "Chakra Petch"; // Rigid square replacement
    if (title.includes("東方")) return "Crimson Text, serif"; // Serif for Touhou stuff
    return DEFAULT_MUSIC_FONT;
}

function trimTrackTitle(title) {
    if (!title) return "";
    const cleanPatterns = [
        /【[^】]*】/, // Touhou n weeb stuff
        " [FREE DOWNLOAD]", // F-777
    ];
    cleanPatterns.forEach(expr => (title = title.replace(expr, "")));
    return title;
}

const getCoverClass = (coverPath, classes) => {
    const id = coverPath?.split("/").at(-1);
    // Fallback class + cover specific class
    return classes
        .split(" ")
        .map(c => `${c} ${c}-${id}`)
        .join(" ");
};

const bindCoverClass = (player, coverClasses, classes = "") =>
    player.bind("cover-path").as(cp => `${classes} ${getCoverClass(cp, coverClasses)}`);

const TrackProgress = player =>
    AnimatedCircProg({
        className: bindCoverClass(player, "music-progress"),
        vpack: "center",
        extraSetup: self => {
            const updateProgress = self => self.attribute.updateProgress(self, (player.position / player.length) * 100);
            self.hook(player, updateProgress, "notify::position").poll(1000, updateProgress);
        },
    });

const TrackTitle = player =>
    Label({
        label: player.bind("track_title").as(title => (title.length > 0 ? trimTrackTitle(title) : "No music playing")),
        xalign: 0,
        truncate: "end",
        className: bindCoverClass(player, "music-title"),
        css: player.bind("track_title").as(() => `font-family: ${getTrackfont(player)}, ${DEFAULT_MUSIC_FONT}`),
    });

const TrackArtists = player =>
    Label({
        xalign: 0,
        className: bindCoverClass(player, "music-artists"),
        truncate: "end",
        label: player.bind("track_artists").as(artists => (artists.length > 0 ? artists.join(", ") : "")),
    });

const CoverArt = player =>
    Box({
        vpack: "center",
        className: bindCoverClass(player, "music-cover-art"),
        homogeneous: true,
        // Fallback
        child: Label({
            className: "icon-material txt-gigantic txt-thin",
            label: player.bind("cover-path").as(cp => (cp ? "" : "music_note")),
        }),
        // CSS image
        setup: self =>
            self.hook(
                player,
                self => {
                    if (player.coverPath) self.css = `background-image: url('${player.coverPath}');`;
                },
                "notify::cover-path"
            ),
    });

const TrackControls = player => {
    const Control = ({ icon, onClicked, revealChild }) =>
        Revealer({
            revealChild: revealChild,
            transition: "slide_right",
            transitionDuration: 180,
            child: Button({
                className: bindCoverClass(player, "music-controlbtn"),
                onClicked: onClicked,
                child: Label({
                    className: "icon-material music-controlbtn-txt",
                    label: icon,
                }),
            }),
        });
    const FAST_FORWARD_AMOUNT = 10;
    const fastForward = amount => (player.position = clamp(player.position + amount, 0, player.length));
    return EventBox({
        onHover: self => {
            for (const ch of [1, 2]) self.child.children[ch].revealChild = true;
        },
        onHoverLost: self => {
            for (const ch of [1, 2]) self.child.children[ch].revealChild = false;
        },
        child: Box({
            vpack: "center",
            className: bindCoverClass(player, "music-controls", "spacing-h-3"),
            children: [
                Control({
                    icon: "skip_previous",
                    onClicked: player.previous,
                    revealChild: player.bind("can_go_prev"),
                }),
                Control({
                    icon: "fast_rewind",
                    onClicked: () => fastForward(-FAST_FORWARD_AMOUNT),
                    revealChild: !(player.canGoPrev && player.canGoNext),
                }),
                Control({
                    icon: "fast_forward",
                    onClicked: () => fastForward(FAST_FORWARD_AMOUNT),
                    revealChild: !(player.canGoPrev && player.canGoNext),
                }),
                Control({
                    icon: "skip_next",
                    onClicked: player.next,
                    revealChild: player.bind("can_go_next"),
                }),
            ],
        }),
    });
};

const TrackTime = player =>
    Revealer({
        revealChild: player.bind("length").as(l => l > 0),
        transition: "slide_left",
        transitionDuration: 200,
        child: Box({
            vpack: "center",
            className: bindCoverClass(player, "music-pill", "spacing-h-5"),
            children: [
                Label({
                    setup: self => {
                        const update = () => (self.label = lengthStr(player.position));
                        self.hook(player, update, "notify::position").poll(1000, update);
                    },
                }),
                Label({ label: "/" }),
                Label({ label: player.bind("length").as(lengthStr) }),
            ],
        }),
    });

const PlayState = player => {
    const hoverLayer = Box({ className: "music-playstate-hover" });

    return Overlay({
        child: Box({ className: bindCoverClass(player, "music-playstate") }),
        overlays: [
            hoverLayer,
            TrackProgress(player),
            Button({
                child: Label({
                    className: bindCoverClass(player, "music-playstate-icon"),
                    justification: "center",
                    hpack: "fill",
                    vpack: "center",
                    label: player.bind("play_back_status").as(status => (status == "Playing" ? "pause" : "play_arrow")),
                }),
                onPrimaryClickRelease: () => player.playPause(),
                onSecondaryClickRelease: () => Players.makeCurrent(player),
                onHover: () => hoverLayer.toggleClassName("music-playstate-hover-on", true),
                onHoverLost: () => hoverLayer.toggleClassName("music-playstate-hover-on", false),
            }),
        ],
    });
};

const Background = player =>
    Box({
        className: bindCoverClass(player, "music-bg"),
        setup: self =>
            self.hook(
                player,
                self => {
                    if (!player.coverPath || !fileExists(player.coverPath)) return;

                    // Blurred and darkened cover as background if imagemagick is installed
                    if (inPath("magick")) {
                        const blurCoverPath = `${player.coverPath}_blur`;
                        if (fileExists(blurCoverPath)) self.css = `background-image: url('${blurCoverPath}');`;
                        else {
                            execAsync([
                                "magick",
                                player.coverPath,
                                "-fill",
                                "black",
                                "-colorize",
                                "50%",
                                "-blur",
                                "0x7",
                                blurCoverPath,
                            ])
                                .then(() => (self.css = `background-image: url('${blurCoverPath}');`))
                                .catch(print);
                        }
                    }

                    const coverId = player.coverPath.split("/").at(-1);
                    const cssPath = `${player.coverPath}.css`;
                    const scssPath = `${player.coverPath}.scss`;

                    const applyCss = () =>
                        execAsync(`sass ${scssPath} ${cssPath}`)
                            .then(() => App.applyCss(cssPath))
                            .catch(print);

                    // Already exists, so just apply css
                    if (fileExists(cssPath)) App.applyCss(cssPath);
                    // Already generated but not compiled, so compile then apply
                    else if (fileExists(scssPath)) applyCss();
                    // Doesn't exist, generate colours, create selectors then compile and apply
                    else {
                        // Generate colours
                        execAsync([
                            "bash",
                            "-c",
                            `${App.configDir}/scripts/color_generation/generate_colors_material.py --path '${player.coverPath}' > ${scssPath}`,
                        ])
                            .then(() => {
                                // Add class selectors
                                execAsync([
                                    "bash",
                                    "-c",
                                    `sed -E 's/(\\.[a-z-]+)/\\1-${coverId}/g' ${App.configDir}/scripts/templates/ags/music.scss >> ${scssPath}`,
                                ])
                                    .then(applyCss)
                                    .catch(print);
                            })
                            .catch(print);
                    }
                },
                "notify::cover-path"
            ),
    });

const MusicControlsWidget = player =>
    Overlay({
        child: Background(player),
        overlays: [
            Box({ className: bindCoverClass(player, "music-gradient") }),
            Box({
                className: "music-inner spacing-h-20",
                children: [
                    CoverArt(player),
                    Box({
                        vertical: true,
                        className: "spacing-v-5 music-info",
                        children: [
                            Box({
                                vertical: true,
                                vpack: "center",
                                hexpand: true,
                                children: [TrackTitle(player), TrackArtists(player)],
                            }),
                            Box({ vexpand: true }),
                            Box({
                                className: "spacing-h-10",
                                setup: box => {
                                    box.pack_start(TrackControls(player), false, false, 0);
                                    box.pack_end(PlayState(player), false, false, 0);
                                    box.pack_end(TrackTime(player), false, false, 0);
                                },
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });

export default () =>
    Revealer({
        transition: "slide_down",
        transitionDuration: 200,
        revealChild: showMusicControls.bind(),
        child: Box({
            children: Mpris.bind("players").as(players => players.filter(isRealPlayer).map(MusicControlsWidget)),
        }),
    });
