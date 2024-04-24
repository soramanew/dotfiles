import GLib from "gi://GLib";

export const OVERVIEW_ROWS = 2;
export const OVERVIEW_COLS = 5;
export const WS_PER_GROUP = 10;
export const SEARCH_MAX_RESULTS = 20;
export const BATTERY_LOW = 20;
export const CACHE_DIR = `${GLib.get_user_cache_dir()}/ags`;
export const COMPILED_STYLE_DIR = `${CACHE_DIR}/user/generated`;
