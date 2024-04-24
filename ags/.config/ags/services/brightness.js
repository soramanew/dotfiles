const { exec, execAsync } = Utils;
import { clamp } from "../modules/.miscutils/mathfuncs.js";

class BrightnessService extends Service {
    static {
        Service.register(this, { "screen-changed": ["float"] }, { "screen-value": ["float", "rw"] });
    }

    #animPoints = [];
    #screenValue;

    // the getter has to be in snake_case
    get screen_value() {
        return this.#screenValue;
    }

    // the setter has to be in snake_case too
    set screen_value(percent) {
        percent = clamp(percent, 0, 1);
        const originalPercent = this.#screenValue;
        this.#screenValue = percent;
        this.emit("screen-changed", percent);
        this.notify("screen-value");

        this.#animPoints.forEach(p => p.destroy());
        this.#animPoints.length = 0;

        const ANIM_TIME = 200;
        const ANIM_POINTS = 10;
        const timePerPoint = ANIM_TIME / ANIM_POINTS;
        const diffPerPoint = (percent - originalPercent) / ANIM_POINTS;
        for (let i = 0; i < ANIM_POINTS; i++)
            this.#animPoints.push(
                setTimeout(() => {
                    execAsync(
                        `brightnessctl set ${Math.round((originalPercent + diffPerPoint * (i + 1)) * 100)}% -q`
                    ).catch(print);
                }, i * timePerPoint)
            );
    }

    constructor() {
        super();
        this.#screenValue = Number(exec("brightnessctl get")) / Number(exec("brightnessctl max"));
    }

    // overwriting connectWidget method, lets you
    // change the default event that widgets connect to
    connectWidget(widget, callback, event = "screen-changed") {
        super.connectWidget(widget, callback, event);
    }
}

// the singleton instance
const service = new BrightnessService();

// make it global for easy use with cli
globalThis.brightness = service;

// export to use in other modules
export default service;
