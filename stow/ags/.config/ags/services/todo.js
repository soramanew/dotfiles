const { exec, readFile, writeFile, CACHE_DIR } = Utils;

class TodoService extends Service {
    static {
        Service.register(this, { updated: [] });
    }

    #todoPath = "";
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
        this.#todoPath = `${CACHE_DIR}/user/todo.json`;
        try {
            const fileContents = readFile(this.#todoPath);
            this.#todoJson = JSON.parse(fileContents);
        } catch {
            exec(`bash -c 'mkdir -p ${CACHE_DIR}/user'`);
            exec(`touch ${this.#todoPath}`);
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
