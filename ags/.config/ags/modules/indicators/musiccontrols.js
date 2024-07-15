import GLib from "gi://GLib";
const Mpris = await Service.import("mpris");
const { exec, execAsync } = Utils;
const { Box, EventBox, Label, Button, Revealer, Overlay } = Widget;

import { fileExists } from "../.miscutils/files.js";
import { AnimatedCircProg } from "../.commonwidgets/cairo_circularprogress.js";
import { showMusicControls } from "../../variables.js";
import { darkMode, hasPlasmaIntegration } from "../.miscutils/system.js";
import { clamp } from "../.miscutils/mathfuncs.js";
import { COMPILED_STYLE_DIR } from "../../constants.js";

const COVER_COLORSCHEME_SUFFIX = "_colorscheme.css";
let lastCoverPath = "";

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

const TrackProgress = ({ player, ...rest }) => {
    const updateProgress = circprog => {
        // Set circular progress (see definition of AnimatedCircProg for explanation)
        circprog.attribute.updateProgress(circprog, (player.position / player.length) * 100);
    };
    return AnimatedCircProg({
        ...rest,
        className: "osd-music-circprog",
        vpack: "center",
        extraSetup: self => self.hook(player, updateProgress, "notify::position").poll(1000, updateProgress),
    });
};

const TrackTitle = ({ player, ...rest }) =>
    Label({
        ...rest,
        label: player.bind("track_title").as(title => (title.length > 0 ? trimTrackTitle(title) : "No music playing")),
        xalign: 0,
        truncate: "end",
        // wrap: true,
        className: "osd-music-title",
        css: player.bind("track_title").as(() => `font-family: ${getTrackfont(player)}, ${DEFAULT_MUSIC_FONT}`),
    });

const TrackArtists = ({ player, ...rest }) =>
    Label({
        ...rest,
        xalign: 0,
        className: "osd-music-artists",
        truncate: "end",
        label: player.bind("track_artists").as(artists => (artists.length > 0 ? artists.join(", ") : "")),
    });

const CoverArt = ({ player, ...rest }) => {
    const fallbackCoverArt = Box({
        // Fallback
        className: "osd-music-cover-fallback",
        homogeneous: true,
        child: Label({
            className: "icon-material txt-gigantic txt-thin",
            label: "music_note",
        }),
    });
    // const coverArtDrawingArea = Widget.DrawingArea({ className: 'osd-music-cover-art' });
    // const coverArtDrawingAreaStyleContext = coverArtDrawingArea.get_style_context();
    const realCoverArt = Box({
        className: "osd-music-cover-art",
        homogeneous: true,
        // children: [coverArtDrawingArea],
        attribute: {
            pixbuf: null,
            // 'showImage': (self, imagePath) => {
            //     const borderRadius = coverArtDrawingAreaStyleContext.get_property('border-radius', Gtk.StateFlags.NORMAL);
            //     const frameHeight = coverArtDrawingAreaStyleContext.get_property('min-height', Gtk.StateFlags.NORMAL);
            //     const frameWidth = coverArtDrawingAreaStyleContext.get_property('min-width', Gtk.StateFlags.NORMAL);
            //     let imageHeight = frameHeight;
            //     let imageWidth = frameWidth;
            //     // Get image dimensions
            //     execAsync(['identify', '-format', '{"w":%w,"h":%h}', imagePath])
            //         .then((output) => {
            //             const imageDimensions = JSON.parse(output);
            //             const imageAspectRatio = imageDimensions.w / imageDimensions.h;
            //             const displayedAspectRatio = imageWidth / imageHeight;
            //             if (imageAspectRatio >= displayedAspectRatio) {
            //                 imageWidth = imageHeight * imageAspectRatio;
            //             } else {
            //                 imageHeight = imageWidth / imageAspectRatio;
            //             }
            //             // Real stuff
            //             // TODO: fix memory leak(?)
            //             // if (self.attribute.pixbuf) {
            //             //     self.attribute.pixbuf.unref();
            //             //     self.attribute.pixbuf = null;
            //             // }
            //             self.attribute.pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_size(imagePath, imageWidth, imageHeight);

            //             coverArtDrawingArea.set_size_request(frameWidth, frameHeight);
            //             coverArtDrawingArea.connect("draw", (widget, cr) => {
            //                 // Clip a rounded rectangle area
            //                 cr.arc(borderRadius, borderRadius, borderRadius, Math.PI, 1.5 * Math.PI);
            //                 cr.arc(frameWidth - borderRadius, borderRadius, borderRadius, 1.5 * Math.PI, 2 * Math.PI);
            //                 cr.arc(frameWidth - borderRadius, frameHeight - borderRadius, borderRadius, 0, 0.5 * Math.PI);
            //                 cr.arc(borderRadius, frameHeight - borderRadius, borderRadius, 0.5 * Math.PI, Math.PI);
            //                 cr.closePath();
            //                 cr.clip();
            //                 // Paint image as bg, centered
            //                 Gdk.cairo_set_source_pixbuf(cr, self.attribute.pixbuf,
            //                     frameWidth / 2 - imageWidth / 2,
            //                     frameHeight / 2 - imageHeight / 2
            //                 );
            //                 cr.paint();
            //             });
            //         }).catch(print)
            // },
            updateCover: self => {
                // const player = Mpris.getPlayer(); // Maybe no need to re-get player.. can't remember why I had this
                // Player closed
                // Note that cover path still remains, so we're checking title
                if (!player || player.trackTitle === "" || !player.coverPath) {
                    self.css = `background-image: none;`; // CSS image
                    App.applyCss(`${COMPILED_STYLE_DIR}/style.css`);
                    return;
                }

                const coverPath = player.coverPath;
                const stylePath = `${player.coverPath}${darkMode.value ? "" : "-l"}${COVER_COLORSCHEME_SUFFIX}`;
                if (player.coverPath == lastCoverPath) {
                    // Since 'notify::cover-path' emits on cover download complete
                    Utils.timeout(200, () => {
                        // self.attribute.showImage(self, coverPath);
                        self.css = `background-image: url('${coverPath}');`; // CSS image
                    });
                }
                lastCoverPath = player.coverPath;

                // If a colorscheme has already been generated, skip generation
                if (fileExists(stylePath)) {
                    // self.attribute.showImage(self, coverPath)
                    self.css = `background-image: url('${coverPath}');`; // CSS image
                    App.applyCss(stylePath);
                    return;
                }

                // Generate colors
                execAsync([
                    "bash",
                    "-c",
                    `${
                        App.configDir
                    }/scripts/color_generation/generate_colors_material.py --path '${coverPath}' --mode ${
                        darkMode.value ? "dark" : "light"
                    } > ${App.configDir}/scss/_musicmaterial.scss`,
                ])
                    .then(() => {
                        exec(`wal -i "${player.coverPath}" -n -t -s -e -q ${darkMode.value ? "" : "-l"}`);
                        exec(`cp ${GLib.get_user_cache_dir()}/wal/colors.scss ${App.configDir}/scss/_musicwal.scss`);
                        exec(`sass ${App.configDir}/scss/_music.scss ${stylePath}`);
                        Utils.timeout(200, () => {
                            // self.attribute.showImage(self, coverPath)
                            self.css = `background-image: url('${coverPath}');`; // CSS image
                        });
                        App.applyCss(stylePath);
                    })
                    .catch(print);
            },
        },
        setup: self => self.hook(player, self => self.attribute.updateCover(self), "notify::cover-path"),
    });
    return Box({
        ...rest,
        className: "osd-music-cover",
        child: Overlay({
            child: fallbackCoverArt,
            overlays: [realCoverArt],
        }),
    });
};

const TrackControls = ({ player, ...rest }) => {
    const Control = ({ icon, onClicked, revealChild }) =>
        Revealer({
            revealChild: revealChild,
            transition: "slide_right",
            transitionDuration: 180,
            child: Button({
                className: "osd-music-controlbtn",
                onClicked: onClicked,
                child: Label({
                    className: "icon-material osd-music-controlbtn-txt",
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
            ...rest,
            vpack: "center",
            className: "osd-music-controls spacing-h-3",
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

const TrackTime = ({ player, ...rest }) =>
    Revealer({
        revealChild: player.bind("length").as(l => l > 0),
        transition: "slide_left",
        transitionDuration: 200,
        child: Box({
            ...rest,
            vpack: "center",
            className: "osd-music-pill spacing-h-5",
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

const PlayState = ({ player }) =>
    Button({
        className: "osd-music-playstate",
        child: Overlay({
            child: TrackProgress({ player: player }),
            overlays: [
                Button({
                    className: "osd-music-playstate-btn osd-music-controlbtn",
                    onClicked: player.playPause,
                    child: Label({
                        justification: "center",
                        hpack: "fill",
                        vpack: "center",
                        label: player
                            .bind("play_back_status")
                            .as(status => (status == "Playing" ? "pause" : "play_arrow")),
                    }),
                }),
            ],
            passThrough: true,
        }),
    });

const MusicControlsWidget = player =>
    Box({
        className: "osd-music spacing-h-20 test",
        children: [
            CoverArt({ player, vpack: "center" }),
            Box({
                vertical: true,
                className: "spacing-v-5 osd-music-info",
                children: [
                    Box({
                        vertical: true,
                        vpack: "center",
                        hexpand: true,
                        children: [TrackTitle({ player }), TrackArtists({ player })],
                    }),
                    Box({ vexpand: true }),
                    Box({
                        className: "spacing-h-10",
                        setup: box => {
                            box.pack_start(TrackControls({ player }), false, false, 0);
                            box.pack_end(PlayState({ player }), false, false, 0);
                            box.pack_end(TrackTime({ player }), false, false, 0);
                            // box.pack_end(TrackSource({ vpack: 'center', player: player }), false, false, 0);
                        },
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
