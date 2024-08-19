import Gdk from "gi://Gdk";
const { Box, Icon, Button } = Widget;
const SystemTray = await Service.import("systemtray");

const SysTrayItem = item =>
    Button({
        className: "bar-systray-item",
        child: Icon({ icon: item.bind("icon") }),
        tooltipMarkup: item.bind("tooltip_markup"),
        onPrimaryClick: (_, event) => item.activate(event),
        onSecondaryClick: btn => item.menu.popup_at_widget(btn, Gdk.Gravity.SOUTH, Gdk.Gravity.NORTH, null),
    });

export default (props = {}) =>
    Box({
        ...props,
        className: "margin-right-5 spacing-h-15",
        children: SystemTray.bind("items").as(i => i.filter(({ id }) => id !== null).map(SysTrayItem)),
    });
