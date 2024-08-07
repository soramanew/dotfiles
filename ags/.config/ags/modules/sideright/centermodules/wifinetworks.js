const { Box, Button, Entry, Label, Revealer, Scrollable } = Widget;
const { execAsync } = Utils;
const Network = await Service.import("network");
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import { setupCursorHover } from "../../.widgetutils/cursorhover.js";

const MATERIAL_SYMBOL_SIGNAL_STRENGTH = {
    "network-wireless-signal-excellent-symbolic": "signal_wifi_4_bar",
    "network-wireless-signal-good-symbolic": "network_wifi_3_bar",
    "network-wireless-signal-ok-symbolic": "network_wifi_2_bar",
    "network-wireless-signal-weak-symbolic": "network_wifi_1_bar",
    "network-wireless-signal-none-symbolic": "signal_wifi_0_bar",
};

let connectAttempt = "";

const WifiNetwork = accessPoint => {
    const networkStrength = MaterialIcon(MATERIAL_SYMBOL_SIGNAL_STRENGTH[accessPoint.iconName], "hugerass");
    const networkName = Box({
        vertical: true,
        children: [
            Label({ hpack: "start", label: accessPoint.ssid }),
            accessPoint.active
                ? Label({ hpack: "start", className: "txt-smaller txt-subtext", label: "Selected" })
                : null,
        ],
    });
    return Button({
        onClicked: accessPoint.active
            ? () => {}
            : () => execAsync(`nmcli device wifi connect ${accessPoint.bssid}`).catch(print),
        child: Box({
            className: "sidebar-wifinetworks-network spacing-h-10",
            children: [
                networkStrength,
                networkName,
                Box({ hexpand: true }),
                accessPoint.active ? MaterialIcon("check", "large") : null,
            ],
        }),
        setup: accessPoint.active ? () => {} : setupCursorHover,
    });
};

const CurrentNetwork = () => {
    let authLock = false;
    const bottomSeparator = Box({ className: "separator-line" });
    const networkName = Box({
        vertical: true,
        hexpand: true,
        children: [
            Label({ hpack: "start", className: "txt-smaller txt-subtext", label: "Current network" }),
            Label({
                hpack: "start",
                label: Network.wifi?.ssid,
                setup: self =>
                    self.hook(Network, self => {
                        if (!authLock) self.label = Network.wifi.ssid;
                    }),
            }),
        ],
    });
    const networkStatus = Box({
        children: [
            Label({
                vpack: "center",
                className: "txt-subtext",
                setup: self =>
                    self.hook(Network, self => {
                        if (!authLock) self.label = Network.wifi.state;
                    }),
            }),
        ],
    });
    const networkAuth = Revealer({
        transition: "slide_down",
        transitionDuration: 180,
        child: Box({
            className: "margin-top-10 spacing-v-5",
            vertical: true,
            children: [
                Label({ className: "margin-left-5", hpack: "start", label: "Authentication" }),
                Box({
                    spacing: 8,
                    vertical: false,
                    children: [
                        Entry({
                            hexpand: true,
                            className: "sidebar-wifinetworks-auth-entry",
                            visibility: false, // Password dots
                            onAccept: self => {
                                authLock = false;
                                networkAuth.revealChild = false;
                                execAsync(
                                    `nmcli device wifi connect '${connectAttempt}' password '${self.text}'`
                                ).catch(print);
                            },
                        }),
                        Button({
                            className: "txt-small sidebar-wifinetworks-closebtn",
                            child: MaterialIcon("close", "norm"),
                            onClicked: () => {
                                authLock = false;
                                networkAuth.revealChild = false;
                                networkName.children[1].label = Network.wifi.ssid;
                                networkStatus.children[0].label = Network.wifi.state;
                            },
                        }),
                    ],
                }),
            ],
        }),
        setup: self =>
            self.hook(Network, self => {
                if (Network.wifi.state == "failed" || Network.wifi.state == "need_auth") {
                    authLock = true;
                    connectAttempt = Network.wifi.ssid;
                    self.revealChild = true;
                }
            }),
    });
    const actualContent = Box({
        vertical: true,
        className: "spacing-v-10",
        children: [
            Box({
                className: "sidebar-wifinetworks-network",
                vertical: true,
                children: [
                    Box({
                        className: "spacing-h-10",
                        children: [MaterialIcon("language", "hugerass"), networkName, networkStatus],
                    }),
                    networkAuth,
                ],
            }),
            bottomSeparator,
        ],
    });
    return Box({
        vertical: true,
        children: [
            Revealer({
                transition: "slide_down",
                transitionDuration: 200,
                revealChild: Network.wifi,
                child: actualContent,
            }),
        ],
    });
};

const NetworkList = () =>
    Scrollable({
        vexpand: true,
        hscroll: "never",
        vscroll: "automatic",
        child: Box({
            attribute: {
                updateNetworks: self =>
                    (self.children = Object.values(
                        (Network.wifi?.access_points || []).reduce((a, accessPoint) => {
                            // Only keep max strength networks by ssid
                            const prev = a[accessPoint.ssid];
                            if (!prev?.active && (!prev || prev.strength < accessPoint.strength))
                                a[accessPoint.ssid] = accessPoint;
                            return a;
                        }, {})
                    )
                        .sort((a, b) => (a.active ? -1 : b.strength - a.strength))
                        .map(WifiNetwork)),
            },
            vertical: true,
            className: "spacing-v-5",
            setup: self => self.hook(Network, self.attribute.updateNetworks),
        }),
    });

export default (props = {}) => {
    return Box({
        ...props,
        className: "spacing-v-10",
        vertical: true,
        children: [CurrentNetwork(), NetworkList()],
    });
};
