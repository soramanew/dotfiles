const { Box, Label, Revealer } = Widget;
import { MaterialIcon } from "../.commonwidgets/materialicon.js";
import { showLockIndicators, isCapsLockOn, isNumLockOn } from "../../variables.js";

const LockIndicatorContent = (name, lockOnVar, onIcon, offIcon) =>
    Box({
        className: "osd-lockindicator osd-label spacing-v-5",
        vertical: true,
        hpack: "center",
        children: [
            Label({
                xalign: 0,
                label: `${name} Lock`,
            }),
            MaterialIcon(offIcon, "hugerass", {
                label: lockOnVar.bind().as(on => (on ? onIcon : offIcon)),
            }),
        ],
    });

export default () =>
    Revealer({
        transition: "slide_down",
        transitionDuration: 120,
        revealChild: showLockIndicators.bind(),
        child: Box({
            hpack: "center",
            children: [
                LockIndicatorContent("Caps", isCapsLockOn, "keyboard_capslock_badge", "keyboard_capslock"),
                LockIndicatorContent("Num", isNumLockOn, "filter_1", "looks_one"),
            ],
        }),
    });
