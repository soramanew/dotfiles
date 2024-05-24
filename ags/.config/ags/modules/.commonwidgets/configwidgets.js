const { Box, Button, Label, Revealer } = Widget;
import { MaterialIcon } from "./materialicon.js";
import { setupCursorHover } from "../.widgetutils/cursorhover.js";

export const ConfigToggle = ({
    icon,
    name,
    desc = "",
    initValue,
    expandWidget = true,
    onChange = () => {},
    extraSetup = () => {},
    ...rest
}) => {
    const enabled = Variable(initValue);
    const toggleIcon = Label({
        className: "icon-material txt-bold",
        setup: self =>
            self.hook(enabled, self => {
                self.toggleClassName("switch-fg-toggling-false", false);
                self.label = enabled.value ? "check" : "";
                self.toggleClassName("txt-poof", !enabled.value);
            }),
    });
    const toggleButtonIndicator = Box({
        className: "switch-fg",
        vpack: "center",
        hpack: "start",
        homogeneous: true,
        children: [toggleIcon],
        setup: self => self.hook(enabled, self => self.toggleClassName("switch-fg-true", enabled.value)),
    });
    const toggleButton = Box({
        hpack: "end",
        className: "switch-bg",
        homogeneous: true,
        children: [toggleButtonIndicator],
        setup: self => self.hook(enabled, self => self.toggleClassName("switch-bg-true", enabled.value)),
    });
    const widgetContent = Box({
        tooltipText: desc,
        className: "txt spacing-h-5 configtoggle-box",
        children: [
            icon ? MaterialIcon(icon, "norm") : null,
            name ? Label({ className: "txt txt-small", label: name }) : null,
            expandWidget ? Box({ hexpand: true }) : null,
            toggleButton,
        ],
    });
    const interactionWrapper = Button({
        attribute: {
            toggle: self => {
                enabled.value = !enabled.value;
                onChange(self, enabled.value);
            },
        },
        child: widgetContent,
        onClicked: self => self.attribute.toggle(self),
        setup: self => {
            setupCursorHover(self);
            self.connect("pressed", () => {
                // mouse down
                toggleIcon.toggleClassName("txt-poof", true);
                toggleIcon.toggleClassName("switch-fg-true", false);
                if (!enabled.value) toggleIcon.toggleClassName("switch-fg-toggling-false", true);
            });
            extraSetup(self);
        },
        ...rest,
    });
    interactionWrapper.enabled = enabled;
    return interactionWrapper;
};

export const ConfigSegmentedSelection = ({
    icon,
    name,
    desc = "",
    options = [
        { name: "Option 1", value: 0 },
        { name: "Option 2", value: 1 },
    ],
    initIndex = 0,
    onChange,
    ...rest
}) => {
    let lastSelected = initIndex;
    const widget = Box({
        tooltipText: desc,
        className: "segment-container",
        // homogeneous: true,
        children: options.map((option, id) => {
            const selectedIcon = Revealer({
                revealChild: id == initIndex,
                transition: "slide_right",
                transitionDuration: 120,
                child: MaterialIcon("check", "norm"),
            });
            return Button({
                setup: setupCursorHover,
                className: `segment-btn ${id == initIndex ? "segment-btn-enabled" : ""}`,
                child: Box({
                    hpack: "center",
                    className: "spacing-h-5",
                    children: [selectedIcon, Label({ label: option.name })],
                }),
                onClicked: self => {
                    const kids = widget.get_children();
                    kids[lastSelected].toggleClassName("segment-btn-enabled", false);
                    kids[lastSelected].get_children()[0].get_children()[0].revealChild = false;
                    lastSelected = id;
                    self.toggleClassName("segment-btn-enabled", true);
                    selectedIcon.revealChild = true;
                    onChange(option.value, option.name);
                },
            });
        }),
        ...rest,
    });
    return widget;
};

export const ConfigMulipleSelection = ({
    icon,
    name,
    desc = "",
    optionsArr = [
        [
            { name: "Option 1", value: 0 },
            { name: "Option 2", value: 1 },
        ],
        [
            { name: "Option 3", value: 0 },
            { name: "Option 4", value: 1 },
        ],
    ],
    initIndex = [0, 0],
    onChange,
    ...rest
}) => {
    const widget = Box({
        tooltipText: desc,
        className: "multipleselection-container spacing-v-3",
        vertical: true,
        children: optionsArr.map((options, grp) =>
            Box({
                className: "spacing-h-5",
                hpack: "center",
                children: options.map((option, id) =>
                    Button({
                        setup: setupCursorHover,
                        className: `multipleselection-btn ${
                            id == initIndex[1] && grp == initIndex[0] ? "multipleselection-btn-enabled" : ""
                        }`,
                        label: option.name,
                        onClicked: self => {
                            const kidsg = widget.get_children();
                            const kids = kidsg.flatMap(widget => widget.get_children());
                            kids.forEach(kid => {
                                kid.toggleClassName("multipleselection-btn-enabled", false);
                            });
                            self.toggleClassName("multipleselection-btn-enabled", true);
                            onChange(option.value, option.name);
                        },
                    })
                ),
            })
        ),
        ...rest,
    });
    return widget;
};

export const ConfigGap = ({ vertical = true, size = 5, ...rest }) =>
    Box({ className: `gap-${vertical ? "v" : "h"}-${size}`, ...rest });
