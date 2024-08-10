const { Box, Label } = Widget;
import { keybindList } from "./data_keybinds.js";

export default () =>
    Box({
        vertical: false,
        className: "spacing-h-15",
        homogeneous: true,
        children: keybindList.map(group =>
            Box({
                // Columns
                vertical: true,
                className: "spacing-v-15",
                children: group.map(({ icon, name, binds }) =>
                    Box({
                        // Categories
                        vertical: true,
                        className: "spacing-v-15",
                        children: [
                            Box({
                                // Category header
                                vertical: false,
                                className: "spacing-h-10",
                                children: [
                                    Label({
                                        xalign: 0,
                                        className: "icon-material txt txt-larger",
                                        label: icon,
                                    }),
                                    Label({
                                        xalign: 0,
                                        className: "cheatsheet-category-title txt",
                                        label: name,
                                    }),
                                ],
                            }),
                            Box({
                                vertical: false,
                                className: "spacing-h-10",
                                children: [
                                    Box({
                                        // Keys
                                        vertical: true,
                                        homogeneous: true,
                                        children: binds.map(({ keys }) =>
                                            Box({
                                                // Binds
                                                vertical: false,
                                                children: keys.map(key =>
                                                    Label({
                                                        // Specific keys
                                                        className: `${
                                                            ["OR", "+"].includes(key)
                                                                ? "cheatsheet-key-notkey"
                                                                : "cheatsheet-key"
                                                        } ${key === "󰖳" ? "cheatsheet-key-super" : ""} txt-small`,
                                                        label: key,
                                                    })
                                                ),
                                            })
                                        ),
                                    }),
                                    Box({
                                        // Actions
                                        vertical: true,
                                        homogeneous: true,
                                        children: binds.map(({ action }) =>
                                            Label({
                                                // Binds
                                                xalign: 0,
                                                label: action,
                                                className: "txt txt-small",
                                            })
                                        ),
                                    }),
                                ],
                            }),
                        ],
                    })
                ),
            })
        ),
    });
