const { Box, Label } = Widget;
const Hyprland = await Service.import("hyprland");

const WindowTitleInner = (className, labelFn) => {
    const label = Hyprland.bind("active").as(labelFn);
    return Label({
        xalign: 0,
        truncate: "end",
        maxWidthChars: 1,
        className: className,
        label: label,
        tooltipText: label,
    });
};

const WindowTitle = () =>
    Box({
        hexpand: true,
        vertical: true,
        className: "bar-space-button",
        children: [
            WindowTitleInner("txt-smaller bar-wintitle-topdesc txt", active => {
                // No active client
                if (active.client.address && active.client.address !== "0x") {
                    if (active.client.class) return active.client.class;
                    const client = Hyprland.getClient(active.client.address);
                    return client ? client.initialClass || client.initialTitle : "";
                }
                return "Desktop";
            }),
            WindowTitleInner("txt-smallie bar-wintitle-txt", active =>
                active.client.address && active.client.address !== "0x"
                    ? active.client.title
                    : `Workspace ${active.workspace.id}`
            ),
        ],
    });

export default () =>
    Box({ className: "bar-wintitle", children: [Box({ className: "bar-corner-spacing" }), WindowTitle()] });
