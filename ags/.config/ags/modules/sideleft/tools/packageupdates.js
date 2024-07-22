const { Box, CenterBox, Label, Button, Revealer, Stack } = Widget;
const { exec } = Utils;
import PackageUpdates from "../../../services/packageupdates.js";
import SidebarModule from "./module.js";
import { setupCursorHover } from "../../.widgetutils/cursorhover.js";
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";

const getDesc = pkg =>
    exec(`pacman -Qi ${pkg}`)
        .split("\n")
        .map(line => line.replace(/[ ]*:/, ":"))
        .join("\n"); // exec(`bash -c "pacman -Qi ${pkg} | grep -Po '^Description\s*: \K.+'"`);
const addVersionChangeToDesc = (update, desc) =>
    desc
        .split("\n")
        .map(line => (/Version[ ]*:.*/.test(line) ? `${line} -> ${update.split("->")[1].trim()}` : line))
        .join("\n");

const Repo = (icon, name, children) => {
    const headerButtonIcon = MaterialIcon("expand_more", "norm");
    const header = Button({
        onClicked: () => {
            content.revealChild = !content.revealChild;
            headerButtonIcon.label = content.revealChild ? "expand_less" : "expand_more";
        },
        setup: setupCursorHover,
        child: Box({
            className: "txt spacing-h-10",
            children: [
                MaterialIcon(icon, "norm"),
                Label({ className: "txt-norm", label: name }),
                Box({ hexpand: true }),
                headerButtonIcon,
            ],
        }),
    });
    const content = Revealer({
        revealChild: false,
        transition: "slide_down",
        transitionDuration: 200,
        child: Box({
            className: "margin-top-5",
            homogeneous: true,
            child: Box({ vertical: true, className: "spacing-v-5", children: children }),
        }),
    });
    return Box({ className: "sidebar-module-repo", vertical: true, children: [header, content] });
};

const Update = ({ pkg, update }) =>
    Box({
        className: "spacing-h-5 txt",
        children: [
            Label({
                xalign: 0,
                className: "txt-small",
                hexpand: true,
                truncate: "end",
                maxWidthChars: 1,
                label: update,
                tooltipText: addVersionChangeToDesc(update, getDesc(pkg)),
            }),
        ],
    });

const IndicatorComponent = (label, className = "") =>
    Box({
        className: `spacing-h-10 ${className}`,
        children: [MaterialIcon("autorenew", "norm"), Label({ className: "txt-norm", label: label })],
    });

const Indicator = () =>
    Stack({
        transition: "slide_up_down",
        transitionDuration: 120,
        children: {
            loading: CenterBox({ centerWidget: IndicatorComponent("Loading updates...", "sidebar-module-loading") }),
            reload: CenterBox({
                centerWidget: Button({
                    className: "sidebar-module-reload",
                    onClicked: () => PackageUpdates.getUpdates(),
                    child: IndicatorComponent("Reload updates"),
                    setup: setupCursorHover,
                }),
            }),
        },
        shown: PackageUpdates.bind("getting-updates").as(gettingUpdates => (gettingUpdates ? "loading" : "reload")),
    });

export default () =>
    SidebarModule({
        icon: MaterialIcon("update", "norm"),
        name: PackageUpdates.bind("updates").as(updates => {
            let label =
                updates.numUpdates > 0
                    ? `Package updates - ${updates.numUpdates} available`
                    : "Package updates - No updates!";
            if (updates.cached) label += " (cached)";
            return label;
        }),
        revealChild: false,
        child: Box({
            vertical: true,
            className: "spacing-v-5",
            children: PackageUpdates.bind("updates").as(updates => {
                const children = [];
                if (updates.numUpdates > 0)
                    for (const repo of updates.updates) {
                        children.push(
                            Repo(repo.icon, `${repo.name} updates - ${repo.updates.length}`, repo.updates.map(Update))
                        );
                    }

                if (updates.errors?.length)
                    children.push(Repo("error", `Errors - ${updates.errors.length}`, updates.errors.map(Update)));

                children.push(Indicator());

                return children;
            }),
        }),
    });
