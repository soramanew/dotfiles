const { Box, Label, Revealer } = Widget;
import { showClock } from "../../variables.js";
import { MaterialIcon } from "../.commonwidgets/materialicon.js";

const timezones = [
    {
        name: "UTC",
        timeFormat: new Intl.DateTimeFormat(undefined, {
            timeStyle: "long",
            timeZone: "UTC",
        }),
        dateFormat: new Intl.DateTimeFormat(undefined, {
            dateStyle: "full",
            timeZone: "UTC",
        }),
    },
    {
        name: "Sydney, Australia",
        timeFormat: new Intl.DateTimeFormat(undefined, {
            timeStyle: "long",
            timeZone: "Australia/Sydney",
        }),
        dateFormat: new Intl.DateTimeFormat(undefined, {
            dateStyle: "full",
            timeZone: "Australia/Sydney",
        }),
    },
];

const Timezone = ({ name, timeFormat, dateFormat }) => {
    const now = new Date();
    const timeLabel = Label({ className: "txt-small txt-subtext", label: timeFormat.format(now) });
    const dateLabel = Label({ className: "txt-small txt-subtext", label: dateFormat.format(now) });
    return Box({
        vertical: true,
        className: "osd-clock-timezone",
        attribute: {
            update: now => {
                timeLabel.label = timeFormat.format(now);
                dateLabel.label = dateFormat.format(now);
            },
        },
        children: [Label({ className: "txt-norm titlefont", label: name }), timeLabel, dateLabel],
    });
};

export default () =>
    Revealer({
        transition: "slide_down",
        transitionDuration: 200,
        revealChild: showClock.bind(),
        child: Box({
            hpack: "center",
            className: "osd-clock spacing-h-10",
            children: [
                Box({
                    vertical: true,
                    children: [
                        MaterialIcon("nest_clock_farsight_analog", "gigantic", { css: "margin-top: -0.2rem;" }),
                        Label({ className: "osd-clock-title txt-norm", label: "Clock" }),
                    ],
                }),
                Box({
                    className: "spacing-h-10",
                    homogeneous: true,
                    children: timezones.map(Timezone),
                    setup: self =>
                        self.poll(1000, () => self.get_children().forEach(ch => ch.attribute.update(new Date()))),
                }),
            ],
        }),
    });
