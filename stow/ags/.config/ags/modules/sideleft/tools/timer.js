const { Box, Button, Label, Entry, Overlay } = Widget;
import SidebarModule from "./module.js";
import { TabContainer } from "../../.commonwidgets/tabcontainer.js";
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import { setupCursorHover } from "../../.widgetutils/cursorhover.js";
import { AnimatedCircProg } from "../../.commonwidgets/cairo_circularprogress.js";

const timeStrToMilli = time => {
    let milli = 0;

    const len = time.length > 3 ? 3 : time.length;
    const units = [3600000, 60000, 1000];

    for (let i = 0; i < len; i++) milli += parseInt(time[i], 10) * units[i + 3 - len];

    return isNaN(milli) ? 0 : milli;
};

const milliToTimeStr = milli => {
    const totalSeconds = Math.floor(milli / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);

    const seconds = totalSeconds % 60;
    const minutes = totalMinutes % 60;
    const hours = Math.min(99, Math.floor(totalMinutes / 60));

    const padStart = n => String(n).padStart(2, "0");

    return `${padStart(hours)}:${padStart(minutes)}:${padStart(seconds)}`;
};

const milliToFTimeStr = milli => {
    const totalSeconds = Math.floor(milli / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);

    const seconds = totalSeconds % 60;
    const minutes = totalMinutes % 60;
    const hours = Math.min(99, Math.floor(totalMinutes / 60));

    let timeStr = "";
    const addTime = (time, unit) => {
        if (time > 0) timeStr += `${time}${unit} `;
    };
    addTime(hours, "h");
    addTime(minutes, "m");
    addTime(seconds, "s");

    return timeStr.trim() || "0s";
};

const Stopwatch = () => Box();

export default () => {
    const Timer = () => {
        let interval;
        const initValue = Variable(0);
        let done = false;
        const timer = Variable(initValue.value);

        const flash = yes => {
            timeDisplay.toggleClassName("sidebar-timer-time-flash", yes);
            timerProgress.toggleClassName("sidebar-timer-prog-flash", yes);
        };

        const updateProgress = () =>
            timerProgress.attribute.updateProgress(
                timerProgress,
                initValue.value === 0 ? 0 : (timer.value / initValue.value) * 100
            );

        const createInterval = () => {
            interval = setInterval(() => {
                timer.value -= 1000;
                updateProgress();
                if (timer.value <= 0) {
                    flash(true);
                    interval.destroy();
                    interval = null;
                    done = true;
                    widget.children[0].child.children[1].label = "Timer/Stopwatch - Timer done!";
                }
            }, 1000);
        };

        const pause = () => {
            startStopButton.child.label = "play_arrow";
            interval.destroy();
            interval = null;
            // widget.children[0].child.children[1].label = "Timer/Stopwatch - Timer paused";
        };

        const startStopButton = Button({
            className: "sidebar-timer-btn",
            onClicked: self => {
                if (done) {
                    flash(false);
                    self.child.label = "play_arrow";
                    done = false;
                    widget.children[0].child.children[1].label = "Timer/Stopwatch";
                } else if (interval) {
                    pause();
                } else if (timer.value > 0) {
                    self.child.label = "pause";
                    createInterval();
                    // widget.children[0].child.children[1].label = "Timer/Stopwatch - Timer running";
                } else {
                    // WHY IS IT SUCH A PAIN TO GET A SIMPLE WARNING FLASH
                    flash(true);
                    Utils.timeout(1000, () => flash(false));
                }
            },
            child: MaterialIcon("play_arrow", "large"),
            setup: setupCursorHover,
        });

        const restartButton = Button({
            className: "sidebar-timer-btn",
            onClicked: () => {
                timer.value = initValue.value;
                updateProgress();
                if (done) {
                    done = false;
                    flash(false);
                    createInterval();
                    widget.children[0].child.children[1].label = "Timer/Stopwatch";
                }
            },
            child: MaterialIcon("restart_alt", "large"),
            setup: setupCursorHover,
        });

        const timeDisplay = Entry({
            xalign: 0.5,
            className: "txt txt-large",
            onAccept: ({ text }) => {
                timer.setValue(timeStrToMilli(text.split(":")));
                initValue.value = timer.value;
                updateProgress();
            },
            setup: self =>
                self
                    .hook(timer, () => self.set_text(milliToTimeStr(timer.value)))
                    .on("focus-in-event", () => {
                        Utils.timeout(1, () => self.grab_focus());
                        if (interval) pause();
                    })
                    .on("focus-out-event", self => {
                        if (self.get_text()) {
                            if (timeStrToMilli(self.get_text().split(":")) !== timer.value) self.activate();
                        } else self.set_text(milliToTimeStr(timer.value));
                    }),
        });

        const timerProgress = AnimatedCircProg({ className: "sidebar-timer-circprog" });

        return Box({
            hpack: "center",
            className: "spacing-h-15 sidebar-timer",
            children: [
                Box({
                    className: "sidebar-timer-info",
                    child: Overlay({
                        child: timerProgress,
                        overlays: [
                            Box({
                                vertical: true,
                                vpack: "center",
                                className: "spacing-v-15",
                                children: [
                                    Label({
                                        className: "txt-subtext txt-small sidebar-timer-total",
                                        label: initValue.bind().as(value => `${milliToFTimeStr(value)} timer`),
                                    }),
                                    timeDisplay,
                                    Box(), // to push the above up slightly via margin
                                ],
                            }),
                        ],
                    }),
                }),
                Box({
                    vertical: true,
                    vpack: "center",
                    className: "spacing-v-10",
                    children: [startStopButton, restartButton],
                }),
            ],
        });
    };

    const widget = SidebarModule({
        icon: MaterialIcon("timer", "norm"),
        name: "Timer/Stopwatch",
        child: TabContainer({
            icons: ["pace", "timelapse"],
            names: ["Timer", "Stopwatch"],
            children: [Timer(), Stopwatch()],
        }),
    });
    return widget;
};
