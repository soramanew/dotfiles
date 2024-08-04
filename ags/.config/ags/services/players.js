const { exec, readFile, writeFile } = Utils;
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
        writeFile(this.#players.map(p => p.name).join("\n"), this.#path).catch(print);
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
            Mpris.connect("player-added", (_, busName) => this.#connectPlayerSignals(Mpris.getPlayer(busName)));

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
