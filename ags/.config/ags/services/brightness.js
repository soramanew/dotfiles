const { exec, execAsync } = Utils;
import { clamp } from "../modules/.miscutils/mathfuncs.js";

class BrightnessService extends Service {
    static {
        Service.register(this, { "screen-changed": ["float"] }, { "screen-value": ["float", "rw"] });
    }

    #screenValue;

    // the getter has to be in snake_case
    get screen_value() {
        return this.#screenValue;
    }

    // the setter has to be in snake_case too
    set screen_value(percent) {
        percent = clamp(percent, 0, 1);
        this.#screenValue = percent;
        this.notify("screen-value");
        this.emit("screen-changed", percent);
        execAsync(`ddcutil setvcp 10 ${Math.round(percent * 100)}`).catch(print);
    }

    constructor() {
        super();
        let info = exec(`ddcutil getvcp 10 --brief`).split("\n");
        info = info[info.length - 1].split(" ");
        this._screenValue = Number(info[3]) / Number(info[4]);
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
