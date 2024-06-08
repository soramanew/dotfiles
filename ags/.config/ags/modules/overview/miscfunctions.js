import Gio from "gi://Gio";
import GLib from "gi://GLib";
const { execAsync } = Utils;
const Hyprland = await Service.import("hyprland");
const Applications = await Service.import("applications");
import Todo from "../../services/todo.js";
import { darkMode } from "../.miscutils/system.js";
import { CACHE_DIR } from "../../constants.js";

// Use a regular expression to match a trailing odd number of backslashes
export const hasUnterminatedBackslash = inputString => /\\+$/.test(inputString);

export const expandTilde = path => (path.startsWith("~") ? GLib.get_home_dir() + path.slice(1) : path);

export const actions = {
    img: {
        desc: "Change wallpaper",
        go: () => execAsync(`${App.configDir}/scripts/color_generation/switchwall.sh`).catch(print),
    },
    colour: {
        desc: "Generate colourscheme from colour picker",
        go: () =>
            execAsync([
                `bash`,
                `-c`,
                `sleep .5 && ${App.configDir}/scripts/color_generation/switchcolor.sh --pick`,
            ]).catch(print),
    },
    light: {
        desc: "Switch to light mode",
        go: () => {
            darkMode.value = false;
            execAsync([
                `bash`,
                `-c`,
                `mkdir -p ${CACHE_DIR}/user && sed -i "1s/.*/light/"  ${CACHE_DIR}/user/colormode.txt`,
            ])
                .then(execAsync(`${App.configDir}/scripts/color_generation/switchcolor.sh`).catch(print))
                .catch(print);
        },
    },
    dark: {
        desc: "Switch to dark mode",
        go: () => {
            darkMode.value = true;
            execAsync([
                `bash`,
                `-c`,
                `mkdir -p ${CACHE_DIR}/user && sed -i "1s/.*/dark/"  ${CACHE_DIR}/user/colormode.txt`,
            ])
                .then(execAsync(`${App.configDir}/scripts/color_generation/switchcolor.sh`).catch(print))
                .catch(print);
        },
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
        go: () => execAsync(["bash", "-c", "systemctl suspend || loginctl suspend"]).catch(print),
    },
    logout: {
        desc: "Logout",
        go: () => Hyprland.messageAsync("dispatch exit").catch(print),
    },
    reload: {
        desc: "Reload AGS desktop file cache (applications list)",
        go: () => Applications.reload(),
    },
};
export const actionsList = Object.keys(actions);

export function launchCustomCommand(command) {
    const args = command.toLowerCase().split(" ");
    const cmd = args[0].slice(1);
    if (actions.hasOwnProperty(cmd)) actions[cmd].go(args.slice(1));
}

export function execAndClose(command, terminal = false, then = () => {}) {
    App.closeWindow("overview");
    if (terminal) {
        execAsync(`foot fish -C "${command}"`).then(then).catch(print);
    } else execAsync(command).then(then).catch(print);
}

function getFileIcon(fileInfo) {
    let icon = fileInfo.get_icon();
    return icon ? icon.get_names()[0] : "text-x-generic"; // Default icon for files
}

export function ls({ path = "~", silent = false }) {
    let contents = [];
    try {
        let expandedPath = expandTilde(path);
        if (expandedPath.endsWith("/")) expandedPath = expandedPath.slice(0, -1);
        let folder = Gio.File.new_for_path(expandedPath);

        let enumerator = folder.enumerate_children("standard::*", Gio.FileQueryInfoFlags.NONE, null);
        let fileInfo;
        while ((fileInfo = enumerator.next_file(null)) !== null) {
            let fileName = fileInfo.get_display_name();
            let fileType = fileInfo.get_file_type();

            let item = {
                parentPath: expandedPath,
                name: fileName,
                type: fileType === Gio.FileType.DIRECTORY ? "folder" : "file",
                icon: getFileIcon(fileInfo),
            };

            // Add file extension for files
            if (fileType === Gio.FileType.REGULAR) {
                let fileExtension = fileName.split(".").pop();
                item.type = `${fileExtension}`;
            }

            contents.push(item);
            contents.sort((a, b) => {
                const aIsFolder = a.type.startsWith("folder");
                const bIsFolder = b.type.startsWith("folder");
                if (aIsFolder && !bIsFolder) {
                    return -1;
                } else if (!aIsFolder && bIsFolder) {
                    return 1;
                } else {
                    return a.name.localeCompare(b.name); // Sort alphabetically within folders and files
                }
            });
        }
    } catch (e) {
        if (!silent) console.log(e);
    }
    return contents;
}

export const openFile = path =>
    execAndClose([
        "bash",
        "-c",
        `dbus-send --session --dest=org.freedesktop.FileManager1 --type=method_call /org/freedesktop/FileManager1 org.freedesktop.FileManager1.ShowItems array:string:"file://${path}" string:"" || xdg-open "${path}"`,
    ]);

export const search = text => execAndClose(["xdg-open", `https://www.google.com/search?q=${text}`]);
