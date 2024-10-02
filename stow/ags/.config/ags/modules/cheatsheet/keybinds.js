const { Box, Label } = Widget;
import { actions, actionsList } from "../overview/miscfunctions.js";

const Header = (icon, name) =>
    Box({
        className: "spacing-h-10",
        children: [
            Label({ xalign: 0, className: "icon-material txt txt-larger", label: icon }),
            Label({ xalign: 0, className: "cheatsheet-category-title txt", label: name }),
        ],
    });

const Key = (key, not = false) =>
    Label({
        className: `cheatsheet-key${not ? "-notkey" : ""} ${key === "󰖳" ? "cheatsheet-key-super" : ""} txt-small`,
        label: key,
    });

const Keys = binds =>
    Box({
        vertical: true,
        homogeneous: true,
        children: binds.map(({ key_combos: combos }) =>
            Box({
                children: combos.flatMap((c, i) => {
                    const keys = [];
                    if (i > 0) keys.push(Key("OR", true));
                    const mods = c.mods.map(key => Key(key));
                    if (mods.length) keys.push(...mods);
                    if (mods.length && c.key) keys.push(Key("+", true));
                    if (c.key) keys.push(Key(c.key));
                    return keys;
                }),
            })
        ),
    });

const Descriptions = binds =>
    Box({
        vertical: true,
        homogeneous: true,
        children: binds.map(({ description }) => Label({ xalign: 0, label: description, className: "txt txt-small" })),
    });

const Section = ({ icon, header, binds }) =>
    Box({
        vertical: true,
        className: "spacing-v-15",
        children: [
            Header(icon, header),
            Box({ className: "spacing-h-10", children: [Keys(binds), Descriptions(binds)] }),
        ],
    });

const Column = sections => Box({ vertical: true, className: "spacing-v-15", children: sections.map(Section) });

export default () =>
    Box({
        className: "cheatsheet-keybinds spacing-h-15",
        setup: self =>
            Utils.execAsync(`${App.configDir}/scripts/hyprland/parse_keybinds.py`)
                .then(JSON.parse)
                .then(out => {
                    out.at(-1).push({
                        icon: "terminal",
                        header: "Launcher actions",
                        binds: actionsList.map(action => ({
                            key_combos: [{ mods: [], key: `>${action}` }],
                            description: actions[action].desc,
                        })),
                    });
                    self.children = out.map(Column);
                })
                .catch(print),
    });
