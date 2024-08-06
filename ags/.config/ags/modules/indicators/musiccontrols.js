const { Box, EventBox, Label, Button, Revealer, Overlay } = Widget;
const { execAsync } = Utils;
const Mpris = await Service.import("mpris");
import { fileExists } from "../.miscutils/files.js";
import { AnimatedCircProg } from "../.commonwidgets/cairo_circularprogress.js";
import { showMusicControls } from "../../variables.js";
import { hasPlasmaIntegration } from "../.miscutils/system.js";
import { clamp } from "../.miscutils/mathfuncs.js";

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

const TrackProgress = player =>
    AnimatedCircProg({
        className: "music-circprog",
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
        className: "music-title",
        css: player.bind("track_title").as(() => `font-family: ${getTrackfont(player)}, ${DEFAULT_MUSIC_FONT}`),
    });

const TrackArtists = player =>
    Label({
        xalign: 0,
        className: "music-artists",
        truncate: "end",
        label: player.bind("track_artists").as(artists => (artists.length > 0 ? artists.join(", ") : "")),
    });

const CoverArt = player =>
    Box({
        vpack: "center",
        className: "music-cover-art",
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
                className: "music-controlbtn",
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
            className: "music-controls spacing-h-3",
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
            className: "music-pill spacing-h-5",
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
    const background = Box({ className: "music-playstate" });

    return Overlay({
        child: background,
        overlays: [
            TrackProgress(player),
            Button({
                child: Label({
                    className: "music-playstate-icon",
                    justification: "center",
                    hpack: "fill",
                    vpack: "center",
                    label: player.bind("play_back_status").as(status => (status == "Playing" ? "pause" : "play_arrow")),
                }),
                onClicked: player.playPause,
                onHover: () => background.toggleClassName("music-playstate-focused", true),
                onHoverLost: () => background.toggleClassName("music-playstate-focused", false),
            }),
        ],
    });
};

const MusicControlsWidget = player =>
    Box({
        className: "music-bg spacing-h-20",
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
        setup: self => {
            // CSS image background
            self.hook(
                player,
                self => {
                    if (player.coverPath) {
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
                                "0x10",
                                blurCoverPath,
                            ])
                                .then(() => (self.css = `background-image: url('${blurCoverPath}');`))
                                .catch(print);
                        }
                    }
                },
                "notify::cover-path"
            );
        },
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
