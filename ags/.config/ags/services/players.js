const { exec, readFile } = Utils;
const Mpris = await Service.import("mpris");
import { CACHE_DIR } from "../constants.js";
import { fileExists } from "../modules/.miscutils/files.js";

class PlayersService extends Service {
    static {
        Service.register(this, {}, { "last-player": ["Ags_MprisPlayer", "r"] });
    }

    #path = `${CACHE_DIR}/media/players.txt`;
    #players = [];

    get last_player() {
        return this.#players[0];
    }

    #save() {
        // writeFile throws errors so use exec instead
        exec(`bash -c "echo '${this.#players.map(p => p.name).join("\n")}' > '${this.#path}'"`);
    }

    #connectPlayerSignals(player) {
        // Change order on attribute change
        for (const signal of [
            "notify::play-back-status",
            "notify::shuffle-status",
            "notify::loop-status",
            "notify::volume",
            "position",
        ])
            player.connect(signal, () => {
                // Remove if present
                const index = this.#players.indexOf(player);
                if (index >= 0) this.#players.splice(index, 1);

                // Add to front
                this.#players.unshift(player);
                this.notify("last-player");

                // Save to file
                this.#save();
            });
    }

    constructor() {
        super();

        // Init stuff after a timeout cause AGS Mpris service needs time to load or something
        Utils.timeout(500, () => {
            if (fileExists(this.#path)) {
                this.#players = readFile(this.#path)
                    .split("\n")
                    .map(p => Mpris.getPlayer(p))
                    .filter(p => p);
                this.notify("last-player");
                this.#save();
            } else {
                exec(`bash -c 'mkdir -p ${CACHE_DIR}/media'`);
                exec(`touch ${this.#path}`);
                const sortOrder = ["Playing", "Paused", "Stopped"];
                this.#players = Mpris.players
                    .sort((a, b) => sortOrder.indexOf(a.playBackStatus) - sortOrder.indexOf(b.playBackStatus))
                    .map(p => p.name);
                this.notify("last-player");
                this.#save();
            }

            // Connect update signals
            for (const player of Mpris.players) this.#connectPlayerSignals(player);
            Mpris.connect("player-added", (_, busName) => {
                const player = Mpris.getPlayer(busName);
                // Connect signals
                this.#connectPlayerSignals(player);

                // Remove if present
                const index = this.#players.indexOf(player);
                if (index >= 0) {
                    this.#players.splice(index, 1);
                    if (index === 0) this.notify("last-player");
                }

                // Set position based on playback status
                const statuses = ["Playing", "Paused", "Stopped"];
                let added = false;
                for (let i = statuses.indexOf(player.playBackStatus); i < statuses.length; i++) {
                    const index = this.#players.findIndex(p => p.playBackStatus === statuses[i]);
                    if (index >= 0) {
                        // Insert before (i.e. becomes) the first player with that status
                        this.#players.splice(index, 0, player);
                        if (index === 0) this.notify("last-player");
                        added = true;
                        break;
                    }
                }
                // If no other players or all other players are playing, add to end
                if (!added) {
                    this.#players.push(player);
                    // Notify if no other players
                    if (this.#players.length === 1) this.notify("last-player");
                }

                // Save to file
                this.#save();
            });

            // Remove when closed
            Mpris.connect("player-closed", (_, busName) => {
                const index = this.#players.findIndex(p => p.busName === busName);
                if (index >= 0) {
                    this.#players.splice(index, 1);
                    if (index === 0) this.notify("last-player");
                    this.#save();
                }
            });
        });
    }
}

// the singleton instance
export default new PlayersService();
