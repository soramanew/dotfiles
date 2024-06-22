const { Box, Icon, Label } = Widget;
const { exec, execAsync } = Utils;
import {
    ToggleIconBluetooth,
    ToggleIconWifi,
    HyprToggleIcon,
    ModuleNightLight,
    ModuleInvertColour,
    ModuleRawInput,
    ModuleIdleInhibitor,
    ModuleReloadIcon,
    ModuleSettingsIcon,
    ModulePowerIcon,
} from "./quicktoggles.js";
import ModuleNotificationList from "./centermodules/notificationlist.js";
import ModuleAudioControls from "./centermodules/audiocontrols.js";
import ModuleWifiNetworks from "./centermodules/wifinetworks.js";
import ModuleBluetooth from "./centermodules/bluetooth.js";
import { ModuleCalendar } from "./calendar.js";
import { getDistroIcon } from "../.miscutils/system.js";
import { ExpandingIconTabContainer } from "../.commonwidgets/tabcontainer.js";
import { checkKeybind, keybinds } from "../.widgetutils/keybind.js";

const centerWidgets = [
    {
        name: "Notifications",
        materialIcon: "notifications",
        contentWidget: ModuleNotificationList(),
    },
    {
        name: "Volume mixer",
        materialIcon: "volume_up",
        contentWidget: ModuleAudioControls(),
    },
    {
        name: "Bluetooth",
        materialIcon: "bluetooth",
        contentWidget: ModuleBluetooth(),
    },
    {
        name: "Wifi networks",
        materialIcon: "wifi",
        contentWidget: ModuleWifiNetworks(),
        onFocus: () => execAsync("nmcli dev wifi list").catch(print),
    },
];

const TimeRow = () =>
    Box({
        className: "spacing-h-10 sidebar-group-invisible-morehorizpad",
        children: [
            Icon({
                icon: getDistroIcon(),
                className: "txt txt-larger",
            }),
            Label({
                hpack: "center",
                className: "txt-small txt",
                setup: self =>
                    self.poll(5000, label => {
                        execAsync([
                            "bash",
                            "-c",
                            `uptime -p | sed -e 's/...//;s/ day\\| days/d/;s/ hour\\| hours/h/;s/ minute\\| minutes/m/;s/,[^,]*//2'`,
                        ])
                            .then(upTimeString => (label.label = `Uptime ${upTimeString}`))
                            .catch(print);
                    }),
            }),
            Box({ hexpand: true }),
            ModuleReloadIcon(),
            ModuleSettingsIcon(),
            ModulePowerIcon(),
        ],
    });

const QuickToggles = () =>
    Box({
        hpack: "center",
        className: "sidebar-togglesbox spacing-h-10",
        children: [
            ToggleIconWifi(),
            ToggleIconBluetooth(),
            ModuleRawInput(),
            HyprToggleIcon("touchpad_mouse", "No touchpad while typing", "input:touchpad:disable_while_typing"),
            ModuleNightLight(),
            ModuleInvertColour(),
            ModuleIdleInhibitor(),
            exec("bash -c 'udevadm info --export-db | grep ID_INPUT_TOUCHSCREEN=1'").trim() !== ""
                ? HyprToggleIcon("do_not_touch", "Disable touchscreen", "input:touchdevice:enabled", [1, 0])
                : null,
        ],
    });

export const sidebarOptionsStack = ExpandingIconTabContainer({
    tabsHpack: "center",
    tabSwitcherClassName: "sidebar-icontabswitcher",
    icons: centerWidgets.map(widget => widget.materialIcon),
    names: centerWidgets.map(widget => widget.name),
    children: centerWidgets.map(widget => widget.contentWidget),
    onChange: (self, id) => {
        self.shown = centerWidgets[id].name;
        centerWidgets[id].onFocus?.();
    },
});
globalThis.sideRightStack = sidebarOptionsStack; // For quick keybinds

export default () =>
    Box({
        vertical: true,
        vexpand: true,
        className: "sidebar-right spacing-v-15",
        children: [
            Box({
                vertical: true,
                className: "spacing-v-5",
                children: [TimeRow(), QuickToggles()],
            }),
            Box({ className: "sidebar-group", child: sidebarOptionsStack }),
            ModuleCalendar(),
        ],
        setup: self =>
            self.on("key-press-event", (_, event) => {
                // Handle keybinds
                if (checkKeybind(event, keybinds.sidebar.nextTab)) {
                    sidebarOptionsStack.nextTab();
                } else if (checkKeybind(event, keybinds.sidebar.prevTab)) {
                    sidebarOptionsStack.prevTab();
                }
            }),
    });
