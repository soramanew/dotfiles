import Pango from "gi://Pango";
const { Box, FlowBox, Label, Button } = Widget;
import GradientScrollable from "../.commonwidgets/gradientscrollable.js";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../../constants.js";
import { ls } from "../.miscutils/files.js";
import WallpaperService from "../../services/wallpaper.js";
import { setupCursorHover } from "../.widgetutils/cursorhover.js";

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
                        ls({ path: `~/Pictures/Wallpapers` })
                            .map(Wallpaper)
                            .forEach(w => self.add(w));
                        self.show_all();
                        App.disconnect(id);
                    }
                });
            },
        }),
    });
