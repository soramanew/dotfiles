import GLib from "gi://GLib";
const { exec, execAsync } = Utils;
const Hyprland = await Service.import("hyprland");
import { CACHE_DIR } from "../constants.js";

class WallpaperService extends Service {
    static {
        Service.register(
            this,
            { triggered: [] },
            {
                enabled: ["boolean", "rw"],
                "next-exec": ["string", "r"],
                "time-until-exec": ["string", "r"],
                paused: ["boolean", "rw"],
            }
        );
    }

    #cacheDir = `${CACHE_DIR}/user/wallpaper`;
    #enabledStorage = `${this.#cacheDir}/enabled.txt`;
    #changeScript = `${App.configDir}/scripts/color_generation/change-wallpaper.sh`;
    #timeoutLength = 900; // seconds
    #pollFrequency = 5000; // ms

    #enabled;
    #timeout;
    #interval;
    #nextExec;
    #timeUntilExec;
    #paused;
    #secsToNextExec;
    #fullscreenCheckInterval;

    get enabled() {
        return this.#enabled;
    }

    set enabled(value) {
        this.#enabled = value;
        this.notify("enabled");
        execAsync(["bash", "-c", `echo '${value}' > '${this.#enabledStorage}'`]).catch(print);
        if (!value) this.#stop();
        else if (this.#timeout === null) this.#go();
    }

    get next_exec() {
        return this.#nextExec.format("%H:%M");
    }

    get time_until_exec() {
        return this.#timeUntilExec;
    }

    get paused() {
        return this.#paused;
    }

    set paused(value) {
        if (value) this.#pause();
        else this.#resume();
    }

    #go(delay = this.#timeoutLength) {
        this.#stop();
        this.#timeout = setTimeout(() => {
            execAsync(this.#changeScript).catch(print);
            this.emit("triggered");
            this.#go();
        }, delay * 1000); // because seconds
        this.#nextExec = GLib.DateTime.new_now_local().add_seconds(delay);
        this.notify("next-exec");
        this.#interval = setInterval(() => this.#updateTime(), this.#pollFrequency);
        this.#fullscreenCheckInterval = setInterval(() => {
            execAsync([
                "bash",
                "-c",
                `hyprctl clients -j | jq '[.[] | select(.address == "${Hyprland.active.client.address}" and .fullscreen)]' | jq length`,
            ])
                .then(out => {
                    if (parseInt(out, 10) > 0) this.#pause();
                    else if (this.#paused) this.#resume();
                })
                .catch(print);
        }, this.#pollFrequency);
    }

    #updateTime() {
        const exactSecDiff = this.#nextExec.difference(GLib.DateTime.new_now_local()) / 1e6;
        this.#secsToNextExec = exactSecDiff;
        const secDiff = Math.floor(exactSecDiff);
        const seconds = secDiff % 60;
        const minutes = Math.floor(secDiff / 60) % 60;
        const hours = Math.floor(secDiff / 60 / 60) % 24;
        const timeStr = [];
        if (hours > 0) timeStr.push(`${hours} ${hours > 1 ? "hours" : "hour"}`);
        if (minutes > 0) timeStr.push(`${minutes} ${minutes > 1 ? "minutes" : "minute"}`);
        if (seconds > 0) timeStr.push(`${seconds} ${seconds > 1 ? "seconds" : "second"}`);
        if (timeStr.length > 1) timeStr.splice(-1, 0, "and");
        this.#timeUntilExec = timeStr.join(" ");
        this.notify("time-until-exec");
    }

    #stop(pause = false) {
        this.#timeout?.destroy();
        this.#timeout = null;
        this.#interval?.destroy();
        this.#interval = null;
        this.#nextExec = "";
        this.notify("next-exec");
        this.#paused = pause;
        this.notify("paused");
        if (!pause) {
            this.#timeUntilExec = "";
            this.notify("time-until-exec");
            this.#fullscreenCheckInterval?.destroy();
            this.#fullscreenCheckInterval = null;
        }
    }

    #pause() {
        this.#stop(true);
    }

    #resume() {
        this.#go(this.#secsToNextExec);
    }

    oneshot() {
        execAsync(this.#changeScript).catch(print);
        if (this.#enabled) this.#go();
    }

    constructor() {
        super();
        exec(`mkdir -p '${this.#cacheDir}'`);
        this.#stop(); // Init values
        this.enabled = exec(`cat '${this.#enabledStorage}'`) === "true";
    }

    // overwriting connectWidget method, lets you
    // change the default event that widgets connect to
    connectWidget(widget, callback, event = "triggered") {
        super.connectWidget(widget, callback, event);
    }
}

// instance
const service = new WallpaperService();
// make it global for easy use with cli
// globalThis.wallpaper = service;
export default service;
