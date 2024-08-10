const { Box, Label } = Widget;
import { gestureList } from "./data_gestures.js";

const Bind = ({ keys }) =>
    Box({
        vertical: false,
        children: keys.map(key =>
            Label({
                // Specific keys
                className: `${key === "to" ? "cheatsheet-key-notkey" : "cheatsheet-key"} txt-small`,
                label: key,
            })
        ),
    });

const CategoryHeader = (icon, name) =>
    Box({
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
    });

const Category = ({ icon, name, binds }) =>
    Box({
        vertical: true,
        className: "spacing-v-15",
        children: [
            CategoryHeader(icon, name),
            Box({
                vertical: false,
                className: "spacing-h-10",
                children: [
                    Box({
                        // Keys
                        vertical: true,
                        homogeneous: true,
                        children: binds.map(Bind),
                    }),
                    Box({
                        // Actions
                        vertical: true,
                        homogeneous: true,
                        children: binds.map(({ action }) =>
                            Label({
                                xalign: 0,
                                label: action,
                                className: "txt cheatsheet-action txt-small",
                            })
                        ),
                    }),
                ],
            }),
        ],
    });

export default () =>
    Box({
        vertical: false,
        className: "spacing-h-15",
        homogeneous: true,
        children: gestureList.map(group =>
            Box({
                // Columns
                vertical: true,
                className: "spacing-v-15",
                children: group.map(Category),
            })
        ),
    });
