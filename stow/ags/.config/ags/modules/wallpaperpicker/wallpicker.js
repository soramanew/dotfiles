import Pango from "gi://Pango";
const { Box, FlowBox, Label, Button } = Widget;
import GradientScrollable from "../.commonwidgets/gradientscrollable.js";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../../constants.js";
import { ls } from "../.miscutils/files.js";
import WallpaperService from "../../services/wallpaper.js";
import { setupCursorHover } from "../.widgetutils/cursorhover.js";
import { inPath } from "../.miscutils/system.js";

const SCALE = 0.18;

const Wallpaper = ({ path, name }) =>
    Button({
        className: WallpaperService.bind("current-wallpaper").as(
            current =>
                `wallpicker-wallpaper ${
                    current === Utils.exec(`realpath ${path}`) ? "wallpicker-wallpaper-active" : ""
                }`
        ),
        tooltipText: path,
        onClicked: () => (WallpaperService.current_wallpaper = path),
        child: Box({
            vertical: true,
            hpack: "center",
            vpack: "center",
            children: [
                Box({
                    css: `
                        min-width: ${SCREEN_WIDTH * SCALE}px; min-height: ${SCREEN_HEIGHT * SCALE}px;
                        background-image: url('${path}');
                    `,
                    className: "wallpicker-wallpaper-preview",
                }),
                Label({ maxWidthChars: 1, truncate: "end", wrapMode: Pango.WrapMode.CHAR, label: name }),
            ],
        }),
        setup: setupCursorHover,
    });

export default () =>
    GradientScrollable({
        child: FlowBox({
            setup: self => {
                const id = App.connect("window-toggled", (_, name, visible) => {
                    if (visible && name === "wallpicker") {
                        const wallpapers = ls({ path: `~/Pictures/Wallpapers` });
                        // Requires ImageMagick
                        if (inPath("identify"))
                            Utils.execAsync([
                                "identify",
                                "-ping",
                                "-format",
                                "%w %h\\n",
                                ...wallpapers.map(w => w.path),
                            ])
                                .then(out => {
                                    out = out.split("\n");
                                    // A bit smaller than screen size
                                    const threshold = [SCREEN_WIDTH, SCREEN_HEIGHT].map(d => d * 0.8);
                                    // Don't show wallpapers that are not the right resolution
                                    wallpapers
                                        .filter((_, i) =>
                                            out[i].split(" ").every((d, j) => parseInt(d, 10) >= threshold[j])
                                        )
                                        .map(Wallpaper)
                                        .forEach(w => self.add(w));
                                    self.show_all();
                                })
                                .catch(print);
                        else {
                            wallpapers.map(Wallpaper).forEach(w => self.add(w));
                            self.show_all();
                        }
                        App.disconnect(id);
                    }
                });
            },
        }),
    });
