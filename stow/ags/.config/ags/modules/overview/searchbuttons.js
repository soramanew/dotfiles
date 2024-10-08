import { SearchItemIcon, SearchItemMaterial } from "./searchitem.js";
import { execAndClose, launchCustomCommand, search } from "./miscfunctions.js";
import { openFile } from "../.miscutils/files.js";
import { substitute } from "../.miscutils/icons.js";

export const DirectoryButton = ({ parentPath, name, icon }) =>
    SearchItemIcon({
        name,
        iconName: substitute(icon),
        actionName: "Open",
        onActivate: () => {
            App.closeWindow("overview");
            openFile(parentPath + "/" + name);
        },
    });

export const DesktopEntryButton = ({ name, iconName, launch }) =>
    SearchItemIcon({
        name,
        iconName,
        actionName: "Launch",
        onActivate: () => {
            App.closeWindow("overview");
            launch();
        },
    });

export const CalculationResultButton = ({ result }) =>
    SearchItemMaterial({
        materialIconName: "calculate",
        name: "Math result",
        actionName: "Copy",
        content: String(result),
        onActivate: () => execAndClose(["wl-copy", "--", String(result)]),
    });

export const ExecuteCommandButton = ({ command, terminal = false }) =>
    SearchItemMaterial({
        materialIconName: terminal ? "terminal" : "settings_b_roll",
        name: "Run command",
        actionName: `Execute${terminal ? " in terminal" : ""}`,
        content: command,
        onActivate: () => execAndClose(command, terminal),
        extraClassName: "techfont",
    });

export const CustomCommandButton = ({
    cmd,
    desc,
    onActivate = () => {
        App.closeWindow("overview");
        launchCustomCommand(cmd);
    },
}) =>
    SearchItemMaterial({
        materialIconName: "settings_suggest",
        name: "Action",
        actionName: "Run",
        content: `${cmd} - ${desc}`,
        onActivate: onActivate,
    });

export const SearchButton = ({ text = "" }) =>
    SearchItemMaterial({
        materialIconName: "travel_explore",
        name: "Search Google",
        actionName: "Go",
        content: text,
        onActivate: () => search(text),
    });
