import GLib from "gi://GLib";
const { exec, execAsync } = Utils;

class WallpaperService extends Service {
    static {
        Service.register(this, {}, { enabled: ["boolean", "rw"], "next-exec": ["string", "r"] });
    }

    #cacheDir = `${GLib.get_user_cache_dir()}/ags/user/wallpaper_change`;
    #enabledStorage = `${this.#cacheDir}/enabled.txt`;
    #changeScript = `${App.configDir}/scripts/color_generation/change-wallpaper.sh`;
    #timeoutLength = 900_000; // 15mins

    #enabled;
    #timeout;
    #nextExec;

    get enabled() {
        return this.#enabled;
    }

    set enabled(value) {
        this.#enabled = value;
        execAsync(["bash", "-c", `echo '${value}' > '${this.#enabledStorage}'`]).catch(print);
        if (!value) this.#stop();
        else if (this.#timeout === null) this.#go();
    }

    get next_exec() {
        return this.#nextExec;
    }

    #go() {
        this.#stop();
        this.#timeout = setTimeout(() => {
            execAsync(this.#changeScript).catch(print);
            this.#go();
        }, this.#timeoutLength);
        const nextExec = new Date(Date.now() + this.#timeoutLength);
        let nextMinutes = nextExec.getMinutes();
        if (nextMinutes < 10) nextMinutes = `0${nextMinutes}`;
        this.#nextExec = `${nextExec.getHours()}:${nextMinutes}`;
        this.notify("next-exec");
    }

    #stop() {
        this.#timeout?.destroy();
        this.#timeout = null;
        this.#nextExec = "";
        this.notify("next-exec");
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
