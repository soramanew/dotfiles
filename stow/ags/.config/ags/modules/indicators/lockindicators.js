const { Box, Label, Revealer, EventBox } = Widget;
import { showLockIndicators, isCapsLockOn, isNumLockOn } from "../../variables.js";

const LockIndicatorContent = (name, lockState, onIcon, offIcon) =>
    Box({
        className: "osd-lockindicator",
        hpack: "center",
        children: [
            Label({
                className: "icon-material txt-hugerass",
                label: lockState.bind().as(on => (on ? onIcon : offIcon)),
            }),
            Label({
                className: "margin-left-5 txt-norm osd-locklabel",
                label: `${name} Lock`,
            }),
        ],
        setup: self =>
            self.hook(lockState, self =>
                self.get_children().forEach(ch => ch.toggleClassName("osd-lockoff", !lockState.value))
            ),
    });

export default () =>
    EventBox({
        onHover: () => (showLockIndicators.value = false),
        child: Revealer({
            transition: "slide_down",
            transitionDuration: 200,
            revealChild: showLockIndicators.bind(),
            child: Box({
                hpack: "center",
                children: [
                    LockIndicatorContent("Caps", isCapsLockOn, "keyboard_capslock_badge", "keyboard_capslock"),
                    LockIndicatorContent("Num", isNumLockOn, "filter_1", "looks_one"),
                ],
            }),
        }),
    });
