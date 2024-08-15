const { execAsync } = Utils;
const Applications = await Service.import("applications");
import Todo from "../../services/todo.js";
import { dispatch } from "../.miscutils/system.js";
import { darkMode } from "../../variables.js";

// Use a regular expression to match a trailing odd number of backslashes
export const hasUnterminatedBackslash = inputString => /\\+$/.test(inputString);

export const actions = {
    colour: {
        desc: "Generate colourscheme from colour picker",
        go: () =>
            execAsync([
                "bash",
                "-c",
                `sleep .5 && ${App.configDir}/scripts/color_generation/switchcolor.sh --pick`,
            ]).catch(print),
    },
    light: {
        desc: "Switch to light mode",
        go: () => (darkMode.value = false),
    },
    dark: {
        desc: "Switch to dark mode",
        go: () => (darkMode.value = true),
    },
    todo: {
        desc: "Add a todo",
        go: args => Todo.add(args.join(" ")),
    },
    shutdown: {
        desc: "Shutdown",
        go: () => execAsync(["bash", "-c", "systemctl poweroff || loginctl poweroff"]).catch(print),
    },
    reboot: {
        desc: "Restart",
        go: () => execAsync(["bash", "-c", "systemctl reboot || loginctl reboot"]).catch(print),
    },
    sleep: {
        desc: "Suspend",
        go: () => execAsync(["bash", "-c", "systemctl suspend-then-hibernate || loginctl suspend"]).catch(print),
    },
    logout: {
        desc: "Logout",
        go: () => dispatch("exit"),
    },
    reload: {
        desc: "Reload AGS desktop file cache (applications list)",
        go: () => Applications.reload(),
    },
};
export const actionsList = Object.keys(actions);

export const launchCustomCommand = command => {
    const args = command.toLowerCase().split(" ");
    const cmd = args[0].slice(1);
    if (actions.hasOwnProperty(cmd)) actions[cmd].go(args.slice(1));
};

export const execAndClose = (command, terminal = false, then = () => {}) => {
    App.closeWindow("overview");
    if (terminal) {
        execAsync(["foot", "fish", "-C", command]).then(then).catch(print);
    } else execAsync(command).then(then).catch(print);
};

export const search = text => execAndClose(["xdg-open", `https://www.google.com/search?q=${text}`]);
