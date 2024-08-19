const { exec, readFile, CACHE_DIR } = Utils;

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = JSON.parse(
    exec(`bash -c "wlr-randr --json | jq '.[0].modes[] | select(.current == true)'"`)
);
export const EXTENDED_BAR = SCREEN_WIDTH / SCREEN_HEIGHT >= 21 / 9;

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
