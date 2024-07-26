import { CACHE_DIR } from "../constants.js";
const { exec, execAsync, readFile, writeFile } = Utils;

class PkgUpdatesService extends Service {
    static {
        Service.register(this, {}, { updates: ["object", "r"], "getting-updates": ["boolean", "r"] });
    }

    #cacheFolder = `${CACHE_DIR}/pkg_updates`;
    #cachePath = `${this.#cacheFolder}/updates.txt`;

    #repoSeparator = "########";
    #errorRegex = /^\s*->/;

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
        execAsync(["bash", "-c", `checkupdates; echo '${this.#repoSeparator}'; yay -Qua; true`])
            .then(updates => {
                const updatesArr = updates
                    .split("\n")
                    .filter(u => u !== this.#repoSeparator && !this.#errorRegex.test(u));
                const numUpdates = updatesArr.length;
                const numErrors = updates
                    .split("\n")
                    .filter(u => u !== this.#repoSeparator && this.#errorRegex.test(u)).length;

                if (numErrors > 0 && numUpdates === 0) {
                    // Get from cache
                    this.#updateFromCache();
                } else if (numUpdates > 0) {
                    const repos = [
                        { repo: this.#getRepo("core"), updates: [], icon: "hub", name: "Core repository" },
                        { repo: this.#getRepo("extra"), updates: [], icon: "add_circle", name: "Extra repository" },
                        {
                            repo: this.#getRepo("multilib"),
                            updates: [],
                            icon: "account_tree",
                            name: "Multilib repository",
                        },
                        {
                            repo: updates
                                .split(this.#repoSeparator)[1]
                                .split("\n")
                                .map(u => u.split(" ")[0]),
                            updates: [],
                            icon: "deployed_code_account",
                            name: "AUR",
                        },
                    ];

                    const errors = [];
                    for (const update of updatesArr) {
                        if (update === this.#repoSeparator) continue;
                        const pkg = update.split(" ")[0];
                        if (this.#errorRegex.test(update)) errors.push({ pkg, update });
                        else for (const repo of repos) if (repo.repo.includes(pkg)) repo.updates.push({ pkg, update });
                    }

                    const out = { numUpdates, updates: repos.filter(r => r.updates.length) };
                    if (errors.length > 0) out.errors = errors;

                    // Cache and set
                    writeFile(JSON.stringify({ cached: true, ...out }), this.#cachePath).catch(print);
                    this.#setUpdates(out);
                }

                this.#gettingUpdates = false;
                this.notify("getting-updates");

                this.#timeout?.destroy();
                this.#timeout = setTimeout(this.getUpdates, 900000);
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
            writeFile(JSON.stringify(this.#updates), this.#cachePath).then(this.#updateFromCache).catch(print);
        }
        this.getUpdates();
    }
}

// the singleton instance
const service = new PkgUpdatesService();

// export to use in other modules
export default service;
