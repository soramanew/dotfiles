const { exec, execAsync, readFile, writeFile, CACHE_DIR } = Utils;
import { GIT_PATHS } from "../constants.js";
import { expandTilde } from "../modules/.miscutils/files.js";

class PkgUpdatesService extends Service {
    static {
        Service.register(this, {}, { updates: ["object", "r"], "getting-updates": ["boolean", "r"] });
    }

    #cacheFolder = `${CACHE_DIR}/pkg_updates`;
    #cachePath = `${this.#cacheFolder}/updates.txt`;

    #timeout;
    #gettingUpdates = false;
    #updates = { cached: true, updates: [], errors: [], git: [] };

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
        Promise.allSettled([
            execAsync("checkupdates"),
            execAsync("yay -Qua"),
            Promise.allSettled(
                GIT_PATHS.map(p => execAsync([`${App.configDir}/scripts/get-remote-diffs.sh`, expandTilde(p)]))
            ),
        ])
            .then(([pacman, yay, git]) => {
                const updates = { updates: [], errors: [], git: [] };

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

                    for (const repo of repos) if (repo.updates.length > 0) updates.updates.push(repo);
                }

                // AUR and devel updates (yay -Qua)
                if (yay.value) {
                    const aur = { updates: [], icon: "deployed_code_account", name: "AUR" };

                    for (const update of yay.value.split("\n")) {
                        if (/^\s*->/.test(update)) updates.errors.push(update); // Error
                        else aur.updates.push({ pkg: update.split(" ")[0], update });
                    }

                    if (aur.updates.length > 0) updates.updates.push(aur);
                }

                // Local git repos
                for (let i = 0; i < git.value.length; i++) {
                    const repoOut = git.value[i];
                    const path = GIT_PATHS[i];
                    if (repoOut.value) {
                        const repo = { path, branches: [] };
                        for (const branch of repoOut.value.split("\n")) {
                            let [name, behind, ahead] = branch.split(" ");
                            behind = parseInt(behind, 10);
                            ahead = parseInt(ahead, 10);
                            if (behind > 0 || ahead > 0) repo.branches.push({ name, behind, ahead });
                        }
                        if (repo.branches.length > 0) updates.git.push(repo);
                    } else if (repoOut.reason) {
                        updates.errors.push(`${path}: ${repoOut.reason}`);
                    }
                }

                if (updates.errors.length > 0 && updates.updates.length === 0 && updates.git.length === 0) {
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
export default new PkgUpdatesService();
