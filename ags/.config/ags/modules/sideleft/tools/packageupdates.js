const { Box, CenterBox, Label, Button, Revealer } = Widget;
const { execAsync, exec } = Utils;
import SidebarModule from "./module.js";
import { setupCursorHover } from "../../.widgetutils/cursorhover.js";
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";

const repoSeparator = "########";

const getUpdates = () => execAsync(["bash", "-c", `checkupdates; echo '${repoSeparator}'; yay -Qua; true`]);
const getRepo = repo => exec(`bash -c "comm -12 <(pacman -Qq | sort) <(pacman -Slq '${repo}' | sort)"`).split("\n");
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

const Update = (pkg, update) =>
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

const TRANSITION_LENGTH = 180;

export default () =>
    SidebarModule({
        icon: MaterialIcon("update", "norm"),
        name: "Package updates - Loading updates...",
        revealChild: false,
        child: Revealer({
            transition: "slide_down",
            transitionDuration: TRANSITION_LENGTH,
            child: Box({ vertical: true, className: "spacing-v-5" }),
        }),
        attribute: {
            update: self => {
                const label = self.children[0].child.children[1];
                label.label = "Package updates - Loading updates...";
                const revealer = self.children[1].child.children[0];
                revealer.revealChild = false;
                const content = revealer.child;
                Utils.timeout(TRANSITION_LENGTH, () => content.get_children().forEach(ch => ch.destroy()));
                getUpdates()
                    .then(updates => {
                        const ERROR_REGEX = /^\s*->/;
                        const updatesArr = updates.split("\n").filter(u => u !== repoSeparator && !ERROR_REGEX.test(u));
                        const numUpdates = updatesArr.length;
                        const numErrors = updates
                            .split("\n")
                            .filter(u => u !== repoSeparator && ERROR_REGEX.test(u)).length;
                        if (numErrors > 0 && numUpdates === numErrors)
                            label.label = "Package updates - Failed to update!!";
                        else if (numUpdates === 0) label.label = "Package updates - No updates!";
                        else {
                            label.label = `Package updates - ${numUpdates} available`;
                            const repos = [
                                { repo: getRepo("core"), updates: [], icon: "hub", name: "Core repository" },
                                { repo: getRepo("extra"), updates: [], icon: "add_circle", name: "Extra repository" },
                                {
                                    repo: getRepo("multilib"),
                                    updates: [],
                                    icon: "account_tree",
                                    name: "Multilib repository",
                                },
                                {
                                    repo: updates
                                        .split(repoSeparator)[1]
                                        .split("\n")
                                        .map(u => u.split(" ")[0]),
                                    updates: [],
                                    icon: "deployed_code_account",
                                    name: "AUR",
                                },
                            ];
                            const errors = [];
                            for (const update of updatesArr) {
                                if (update === repoSeparator) continue;
                                const pkg = update.split(" ")[0];
                                if (ERROR_REGEX.test(update)) errors.push(Update(pkg, update));
                                else
                                    for (const repo of repos)
                                        if (repo.repo.includes(pkg)) repo.updates.push(Update(pkg, update));
                            }
                            for (const repo of repos.filter(r => r.updates.length)) {
                                content.pack_start(
                                    Repo(repo.icon, `${repo.name} updates - ${repo.updates.length}`, repo.updates),
                                    false,
                                    false,
                                    0
                                );
                            }
                            if (errors.length)
                                content.pack_start(Repo("error", `Errors - ${errors.length}`, errors), false, false, 0);
                        }
                        content.pack_start(
                            CenterBox({
                                centerWidget: Button({
                                    className: "sidebar-module-reload",
                                    onClicked: () => self.attribute.update(self),
                                    setup: setupCursorHover,
                                    child: Box({
                                        className: "txt spacing-h-10",
                                        children: [
                                            MaterialIcon("autorenew", "norm"),
                                            Label({ className: "txt-norm", label: "Reload Updates" }),
                                        ],
                                    }),
                                }),
                            }),
                            false,
                            false,
                            0
                        );
                        content.show_all();
                        revealer.revealChild = true;
                    })
                    .catch(print);
            },
        },
        setup: self => self.attribute.update(self),
    });
