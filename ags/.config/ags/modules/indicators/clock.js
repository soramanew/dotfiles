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
    const now = Variable("", { poll: [1000, () => new Date()] });
    return Box({
        vertical: true,
        className: "osd-clock-timezone",
        children: [
            Label({ className: "txt-norm titlefont", label: name }),
            Label({ className: "txt-small txt-subtext", label: now.bind().as(timeFormat.format) }),
            Label({ className: "txt-small txt-subtext", label: now.bind().as(dateFormat.format) }),
        ],
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
                }),
            ],
        }),
    });
