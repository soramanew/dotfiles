import { CACHE_DIR } from "../constants.js";
const { exec, execAsync, readFile, writeFile } = Utils;

class PkgUpdatesService extends Service {
    static {
        Service.register(this, {}, { updates: ["object", "r"], "getting-updates": ["boolean", "r"] });
    }

    #cacheFolder = `${CACHE_DIR}/pkg_updates`;
    #cachePath = `${this.#cacheFolder}/updates.txt`;

    #timeout;
    #gettingUpdates = false;
    #updates = { cached: true, numUpdates: 0 };

    get updates() {
        return this.#updates;
    }

    get getting_updates() {
        return this.#gettingUpdates;
    }

    #setUpdates(value) {
        this.#updates = value;
        this.notify("updates");
    }

    #updateFromCache() {
        this.#setUpdates(JSON.parse(readFile(this.#cachePath)));
    }

    #getRepo(repo) {
        return exec(`bash -c "comm -12 <(pacman -Qq | sort) <(pacman -Slq '${repo}' | sort)"`).split("\n");
    }

    getUpdates() {
        // Return if already getting updates
        if (this.#gettingUpdates) return;

        this.#gettingUpdates = true;
        this.notify("getting-updates");

        // Get new updates
        Promise.allSettled([execAsync("checkupdates"), execAsync("yay -Qua")])
            .then(([pacman, yay]) => {
                const updates = { updates: [], errors: [] };

                // Pacman updates (checkupdates)
                if (pacman.value) {
                    const repos = [
                        { repo: this.#getRepo("core"), updates: [], icon: "hub", name: "Core repository" },
                        { repo: this.#getRepo("extra"), updates: [], icon: "add_circle", name: "Extra repository" },
                        {
                            repo: this.#getRepo("multilib"),
                            updates: [],
                            icon: "account_tree",
                            name: "Multilib repository",
                        },
                    ];

                    for (const update of pacman.value.split("\n")) {
                        const pkg = update.split(" ")[0];
                        for (const repo of repos) if (repo.repo.includes(pkg)) repo.updates.push({ pkg, update });
                    }

                    updates.updates.push(...repos.filter(r => r.updates.length));
                }

                // AUR and devel updates (yay -Qua)
                if (yay.value) {
                    const aur = { updates: [], icon: "deployed_code_account", name: "AUR" };
                    const errors = [];

                    for (const update of yay.value.split("\n")) {
                        const pkg = update.split(" ")[0];
                        if (/^\s*->/.test(update)) errors.push({ pkg, update }); // Error
                        else aur.updates.push({ pkg, update });
                    }

                    updates.updates.push(aur);
                    updates.errors.push(...errors);
                }

                if (updates.errors.length > 0 && updates.updates.length === 0) {
                    this.#updateFromCache();
                } else {
                    // Cache and set
                    writeFile(JSON.stringify({ cached: true, ...updates }), this.#cachePath).catch(print);
                    this.#setUpdates(updates);
                }

                this.#gettingUpdates = false;
                this.notify("getting-updates");

                this.#timeout?.destroy();
                this.#timeout = setTimeout(() => this.getUpdates(), 900000);
            })
            .catch(print);
    }

    constructor() {
        super();
        try {
            this.#updateFromCache();
        } catch {
            exec(`bash -c 'mkdir -p ${this.#cacheFolder}'`);
            exec(`touch ${this.#cachePath}`);
            writeFile(JSON.stringify(this.#updates), this.#cachePath)
                .then(() => this.#updateFromCache())
                .catch(print);
        }
        this.getUpdates();
    }
}

// the singleton instance
const service = new PkgUpdatesService();

// export to use in other modules
export default service;
