class IndicatorService extends Service {
    static {
        Service.register(this, { popup: ["int"] }, { count: ["int", "r"] });
    }

    #delay = 1500;
    #count = 0;
    #timeout;

    get count() {
        return this.#count;
    }

    popup(value) {
        this.emit("popup", value);
        if (value < 0) {
            this.#updateCount(0);
            return;
        }
        this.#updateCount(value);
        this.#timeout?.destroy();
        this.#timeout = setTimeout(() => this.#tick(), this.#delay);
    }

    #tick() {
        this.#updateCount(this.#count - 1);

        if (this.#count > 0) this.#timeout = setTimeout(() => this.#tick(), this.#delay);
        else this.emit("popup", -1);
    }

    #updateCount(value) {
        this.#count = value;
        this.notify("count");
    }

    connectWidget(widget, callback) {
        connect(this, widget, callback, "popup");
    }
}

// the singleton instance
const service = new IndicatorService();

// make it global for easy use with cli
globalThis.indicator = service;

// export to use in other modules
export default service;
