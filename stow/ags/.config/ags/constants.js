import GLib from "gi://GLib";
const { exec, readFile } = Utils;

export const SCREEN_WIDTH = Number(
    exec(
        `bash -c "xrandr --current | grep '*' | uniq | awk '{print $1}' | cut -d 'x' -f1 | head -1" | awk '{print $1}'`
    )
);
export const SCREEN_HEIGHT = Number(
    exec(
        `bash -c "xrandr --current | grep '*' | uniq | awk '{print $1}' | cut -d 'x' -f2 | head -1" | awk '{print $1}'`
    )
);
export const EXTENDED_BAR = SCREEN_WIDTH / SCREEN_HEIGHT >= 21 / 9;

export const CACHE_DIR = `${GLib.get_user_cache_dir()}/ags`;
export const COMPILED_STYLE_DIR = `${CACHE_DIR}/user/generated`;
export const COLOUR_MODE_FILE = `${CACHE_DIR}/user/colormode.txt`;

const dotsDir = exec(`realpath ${exec(`realpath '${App.configDir}'`)}/../../../..`);
export const GIT_PATHS = [
    dotsDir,
    `${dotsDir}/firefox/ShyFox`,
    `${dotsDir}/stow/vesktop/.config/vesktop/arrpc`,
    `${dotsDir}/stow/theming/.icons/candy-icons`,
];
try {
    GIT_PATHS.push(...JSON.parse(readFile(`${App.configDir}/gitpaths.json`)));
} catch {}

export const OVERVIEW_ROWS = 2;
export const OVERVIEW_COLS = 5;
export const WS_PER_GROUP = 10;
export const SEARCH_MAX_RESULTS = 20;
export const BATTERY_LOW = 20;
