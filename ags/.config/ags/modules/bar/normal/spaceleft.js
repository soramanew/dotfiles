const { Box, Label } = Widget;
const Hyprland = await Service.import("hyprland");

const WindowTitleInner = (className, type, placeholder) => {
    const label = Hyprland.bind("active").as(active =>
        active.client[type].length ? active.client[type] : placeholder(active)
    );
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
            WindowTitleInner("txt-smaller bar-wintitle-topdesc txt", "class", () => "Desktop"),
            WindowTitleInner("txt-smallie bar-wintitle-txt", "title", active => `Workspace ${active.workspace.id}`),
        ],
    });

export default () =>
    Box({ className: "bar-wintitle", children: [Box({ className: "bar-corner-spacing" }), WindowTitle()] });
