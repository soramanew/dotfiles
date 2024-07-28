import GLib from "gi://GLib";
const { exec } = Utils;

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

export const OVERVIEW_ROWS = 2;
export const OVERVIEW_COLS = 5;
export const WS_PER_GROUP = 10;
export const SEARCH_MAX_RESULTS = 20;
export const BATTERY_LOW = 20;
export const CACHE_DIR = `${GLib.get_user_cache_dir()}/ags`;
export const COMPILED_STYLE_DIR = `${CACHE_DIR}/user/generated`;
