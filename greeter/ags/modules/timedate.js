const { Box, Label } = Widget;

const Time = () =>
    Label({
        className: "time",
        label: Variable("", {
            poll: [5000, () => new Date().toLocaleTimeString(undefined, { timeStyle: "short" }).toUpperCase()],
        }).bind(),
    });

const DateWidget = () =>
    Label({
        className: "date",
        label: Variable("", {
            poll: [60000, () => new Date().toLocaleDateString(undefined, { dateStyle: "full" })],
        }).bind(),
    });

export default () =>
    Box({
        vertical: true,
        hpack: "center",
        vpack: "start",
        className: "time-date",
        children: [Time(), DateWidget()],
    });
