const { readFile, writeFile, CACHE_DIR, ensureDirectory } = Utils;

class TodoService extends Service {
    static {
        Service.register(this, { updated: [] });
    }

    #cacheDir = `${CACHE_DIR}/user`;
    #todoPath = `${this.#cacheDir}/todo.json`;
    #todoJson = [];

    refresh(value) {
        this.emit("updated", value);
    }

    get todo_json() {
        return this.#todoJson;
    }

    _save() {
        writeFile(JSON.stringify(this.#todoJson), this.#todoPath).catch(print);
    }

    add(content) {
        this.#todoJson.push({ content, done: false });
        this._save();
        this.emit("updated");
    }

    edit(index, value) {
        this.#todoJson[index].content = value;
        this._save();
        this.emit("updated");
    }

    check(index) {
        this.#todoJson[index].done = true;
        this._save();
        this.emit("updated");
    }

    uncheck(index) {
        this.#todoJson[index].done = false;
        this._save();
        this.emit("updated");
    }

    remove(index) {
        this.#todoJson.splice(index, 1);
        writeFile(JSON.stringify(this.#todoJson), this.#todoPath).catch(print);
        this.emit("updated");
    }

    constructor() {
        super();
        try {
            this.#todoJson = JSON.parse(readFile(this.#todoPath));
        } catch {
            ensureDirectory(this.#cacheDir);
            writeFile("[]", this.#todoPath)
                .then(() => (this.#todoJson = JSON.parse(readFile(this.#todoPath))))
                .catch(print);
        }
    }

    // overwriting connectWidget method, lets you
    // change the default event that widgets connect to
    connectWidget(widget, callback, event = "updated") {
        super.connectWidget(widget, callback, event);
    }
}

// the singleton instance
const service = new TodoService();

// make it global for easy use with cli
globalThis.todo = service;

// export to use in other modules
export default service;
