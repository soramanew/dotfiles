import Gdk from "gi://Gdk";
const { Box, Icon, Button, Revealer } = Widget;
const SystemTray = await Service.import("systemtray");

const SysTrayItem = item =>
    Button({
        className: "bar-systray-item",
        child: Icon({ icon: item.bind("icon") }),
        tooltipMarkup: item.bind("tooltip_markup"),
        onPrimaryClick: (_, event) => item.activate(event),
        onSecondaryClick: btn => item.menu.popup_at_widget(btn, Gdk.Gravity.SOUTH, Gdk.Gravity.NORTH, null),
    });

export default (props = {}) => {
    const trayContent = Box({
        className: "margin-right-5 spacing-h-15",
        children: SystemTray.bind("items").as(i => i.filter(({ id }) => id !== null).map(SysTrayItem)),
    });
    const trayRevealer = Revealer({
        revealChild: true,
        transition: "slide_left",
        transitionDuration: 180,
        child: trayContent,
    });
    return Box({ ...props, child: trayRevealer });
};
