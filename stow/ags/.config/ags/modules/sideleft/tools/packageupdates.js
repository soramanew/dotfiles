import Pango from "gi://Pango";
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
                Label({
                    xalign: 0,
                    className: "txt-norm",
                    hexpand: true,
                    truncate: "end",
                    maxWidthChars: 1,
                    label: name,
                }),
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

const Text = (text, tooltip = text) =>
    Label({
        xalign: 0,
        className: "txt txt-small",
        hexpand: true,
        truncate: "end",
        maxWidthChars: 1,
        label: text,
        tooltipText: tooltip,
    });

const Update = ({ pkg, update }) => Text(update, addVersionChangeToDesc(update, getDesc(pkg)));

const Error = err =>
    Label({
        xalign: 0,
        className: "txt txt-small",
        hexpand: true,
        wrap: true,
        wrapMode: Pango.WrapMode.WORD_CHAR,
        label: err,
        tooltipText: err,
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
        name: PackageUpdates.bind("updates").as(({ cached, updates, errors, git }) => {
            const numUpdates = updates.reduce((acc, repo) => acc + repo.updates.length, 0) + git.length;
            const status = [];
            if (numUpdates > 0) status.push(`${numUpdates} available`);
            if (errors.length > 0) status.push(`${errors.length} errors`);
            let label =
                numUpdates + errors.length > 0
                    ? `Package updates - ${status.join(", ")}`
                    : "Package updates - No updates!";
            if (cached) label += " (cached)";
            return label;
        }),
        revealChild: false,
        child: Box({
            vertical: true,
            className: "sidebar-module-packageupdates spacing-v-5",
            children: PackageUpdates.bind("updates").as(({ updates, errors, git }) => {
                const children = [];
                for (const repo of updates) {
                    children.push(
                        Repo(repo.icon, `${repo.name} updates - ${repo.updates.length}`, repo.updates.map(Update))
                    );
                }

                if (git.length > 0)
                    children.push(
                        Repo(
                            "linked_services",
                            `Git changes - ${git.length}`,
                            git.map(({ path, branches }) => {
                                const ahead = branches.reduce((acc, { ahead }) => acc + ahead, 0);
                                const behind = branches.reduce((acc, { behind }) => acc + behind, 0);
                                const status = [];
                                if (ahead > 0) status.push(`${ahead} ahead`);
                                if (behind > 0) status.push(`${behind} behind`);
                                return Text(
                                    [
                                        `${path} - ${status.join(", ")}`,
                                        ...branches.map(({ name, ahead, behind }) => {
                                            const status = [];
                                            if (ahead > 0) status.push(`${ahead} commit${ahead > 1 ? "s" : ""} ahead`);
                                            if (behind > 0)
                                                status.push(`${behind} commit${behind > 1 ? "s" : ""} behind`);
                                            return `${name} - ${status.join(", ")}`;
                                        }),
                                    ].join("\n ˪ ")
                                );
                            })
                        )
                    );

                if (errors.length > 0) children.push(Repo("error", `Errors - ${errors.length}`, errors.map(Error)));

                children.push(Indicator());

                return children;
            }),
        }),
    });
