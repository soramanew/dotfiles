const { Box, Button, Icon, Label, Scrollable, Stack } = Widget;
const { execAsync } = Utils;
const Bluetooth = await Service.import("bluetooth");
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import { setupCursorHover } from "../../.widgetutils/cursorhover.js";
import { ConfigToggle } from "../../.commonwidgets/configwidgets.js";
import { RoundedScrollable } from "../../.commonwidgets/cairo_roundedscrollable.js";

// can't connect: sync_problem

const USE_SYMBOLIC_ICONS = true;

const BluetoothDevice = device => {
    // console.log(device);
    const deviceIcon = Icon({
        className: "sidebar-bluetooth-appicon",
        vpack: "center",
        tooltipText: device.name,
        setup: self =>
            self.hook(device, self => (self.icon = `${device.iconName}${USE_SYMBOLIC_ICONS ? "-symbolic" : ""}`)),
    });
    const deviceStatus = Box({
        hexpand: true,
        vpack: "center",
        vertical: true,
        children: [
            Label({
                xalign: 0,
                maxWidthChars: 10,
                truncate: "end",
                label: device.bind("name"),
                className: "txt-small",
            }),
            Label({
                xalign: 0,
                maxWidthChars: 10,
                truncate: "end",
                label: Utils.merge([device.bind("connected"), device.bind("paired")], (connected, paired) =>
                    connected ? "Connected" : paired ? "Paired" : ""
                ),
                className: "txt-subtext",
            }),
        ],
    });
    const deviceConnectButton = ConfigToggle({
        vpack: "center",
        expandWidget: false,
        desc: "Toggle connection",
        initValue: device.connected,
        onChange: (_, newValue) => device.setConnection(newValue),
        extraSetup: self =>
            self.hook(
                device,
                self => Utils.timeout(200, () => (self.enabled.value = device.connected)),
                "notify::connected"
            ),
    });
    const deviceRemoveButton = Button({
        vpack: "center",
        className: "sidebar-bluetooth-device-remove",
        child: MaterialIcon("delete", "norm"),
        tooltipText: "Remove device",
        setup: setupCursorHover,
        onClicked: () => execAsync(["bluetoothctl", "remove", device.address]).catch(print),
    });
    return Box({
        className: "sidebar-bluetooth-device spacing-h-10",
        children: [
            deviceIcon,
            deviceStatus,
            Box({
                className: "spacing-h-5",
                children: [deviceConnectButton, deviceRemoveButton],
            }),
        ],
    });
};

export default (props = {}) => {
    const emptyContent = Box({
        vertical: true,
        vpack: "center",
        className: "spacing-v-5 txt-subtext",
        children: [
            MaterialIcon("bluetooth_disabled", "gigantic"),
            Label({ label: "No Bluetooth devices", className: "txt-small" }),
        ],
    });
    const deviceList = RoundedScrollable({
        vexpand: true,
        overlayClass: "sidebar-scrollcorner1",
        child: Box({
            vertical: true,
            className: "spacing-v-5",
            children: Bluetooth.bind("devices").as(d => d.map(BluetoothDevice)),
        }),
    });
    return Stack({
        ...props,
        children: {
            empty: emptyContent,
            list: deviceList,
        },
        shown: Bluetooth.bind("devices").as(devices => (devices.length > 0 ? "list" : "empty")),
    });
};
