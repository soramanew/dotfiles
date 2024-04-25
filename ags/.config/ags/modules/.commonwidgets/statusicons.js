const { Box, Revealer, Label, Stack, Icon } = Widget;
const Audio = await Service.import("audio");
const Bluetooth = await Service.import("bluetooth");
const Network = await Service.import("network");
const Notifications = await Service.import("notifications");
const Hyprland = await Service.import("hyprland");
import { MaterialIcon } from "./materialicon.js";
import { languages } from "./statusicons_languages.js";
import { isCapsLockOn, isNumLockOn } from "../../variables.js";
import { isUsingHeadphones } from "../.miscutils/system.js";

// A guessing func to try to support langs not listed in data/languages.js
function isLanguageMatch(abbreviation, word) {
    const lowerAbbreviation = abbreviation.toLowerCase();
    const lowerWord = word.toLowerCase();
    let j = 0;
    for (let i = 0; i < lowerWord.length; i++) {
        if (lowerWord[i] === lowerAbbreviation[j]) j++;
        if (j === lowerAbbreviation.length) return true;
    }
    return false;
}

const LockIndicator = (variable, icon) =>
    Revealer({
        transition: "slide_left",
        transitionDuration: 120,
        revealChild: variable.bind(),
        child: MaterialIcon(icon, "norm"),
    });

const VolumeMuteIndicator = () =>
    Revealer({
        transition: "slide_left",
        transitionDuration: 120,
        revealChild: false,
        setup: self => self.hook(Audio, self => (self.revealChild = Audio.speaker?.stream?.isMuted)),
        child: Stack({
            transition: "slide_up_down",
            transitionDuration: 120,
            children: { speakers: MaterialIcon("volume_off", "norm"), headphones: MaterialIcon("headset_off", "norm") },
            setup: self => self.hook(Audio, self => (self.shown = isUsingHeadphones() ? "headphones" : "speakers")),
        }),
    });

const MicMuteIndicator = () =>
    Revealer({
        transition: "slide_left",
        transitionDuration: 120,
        revealChild: false,
        setup: self => self.hook(Audio, self => (self.revealChild = Audio.microphone?.stream?.isMuted)),
        child: MaterialIcon("mic_off", "norm"),
    });

const NotificationIndicator = () => {
    const unreadCount = Variable(0);
    App.connect("window-toggled", (_, window, visible) => {
        if (visible && window === "sideright") unreadCount.value = 0;
    });
    Notifications.connect("notified", (_, id) => {
        if (Notifications.getNotification(id) && !App.getWindow("sideright").visible) unreadCount.value++;
    });
    let lastClosedId; // This is to prevent from deducting if same id because two signals are sent when closed idk why
    Notifications.connect("closed", (_, id) => {
        if (id !== lastClosedId && unreadCount.value > 0) {
            unreadCount.value--;
            lastClosedId = id;
        }
    });
    return Revealer({
        transition: "slide_left",
        transitionDuration: 150,
        revealChild: unreadCount.bind().as(unread => unread > 0),
        tooltipText: unreadCount.bind().as(unread => `${unread} unread notifications`),
        child: Box({
            children: [
                MaterialIcon("notifications", "norm"),
                Label({
                    className: "txt-small titlefont",
                    label: unreadCount.bind().as(String),
                }),
            ],
        }),
    });
};

export const BluetoothIndicator = (tooltip = false) =>
    Stack({
        transition: "slide_up_down",
        transitionDuration: 120,
        tooltipText: tooltip
            ? Bluetooth.bind("connected-devices").as(
                  devices =>
                      "Connected devices: " +
                      devices.map(d => d.name + (d.batteryPercentage ? ` (${d.batteryPercentage}%)` : "")).join(", ")
              )
            : "",
        children: {
            false: MaterialIcon("bluetooth_disabled", "norm"),
            true: MaterialIcon("bluetooth", "norm"),
        },
        shown: Bluetooth.bind("enabled").as(String),
    });

const BluetoothDevices = () =>
    Box({
        className: "spacing-h-5",
        visible: Bluetooth.bind("connected-devices").as(cd => cd.length > 0),
        children: Bluetooth.bind("connected-devices").as(cd =>
            cd.map(device =>
                Box({
                    className: "bar-bluetooth-device spacing-h-5",
                    vpack: "center",
                    tooltipText: device.name,
                    children: [
                        Icon(`${device.iconName}-symbolic`),
                        device.batteryPercentage
                            ? Label({
                                  className: "txt-smallie",
                                  label: device.bind("battery-percentage").as(String),
                              })
                            : null,
                    ],
                })
            )
        ),
    });

const NetworkWiredIndicator = () =>
    Stack({
        transition: "slide_up_down",
        transitionDuration: 120,
        children: {
            fallback: SimpleNetworkIndicator(),
            unknown: MaterialIcon("wifi_off", "norm"),
            disconnected: MaterialIcon("signal_wifi_off", "norm"),
            connected: MaterialIcon("lan", "norm"),
            connecting: MaterialIcon("settings_ethernet", "norm"),
        },
        setup: self =>
            self.hook(Network, stack => {
                if (!Network.wired) return;

                const { internet } = Network.wired;
                if (["connecting", "connected"].includes(internet)) stack.shown = internet;
                else if (Network.connectivity !== "full") stack.shown = "disconnected";
                else stack.shown = "fallback";
            }),
    });

const SimpleNetworkIndicator = () =>
    Icon().hook(Network, self => {
        const icon = Network[Network.primary || "wifi"]?.iconName;
        self.icon = icon || "";
        self.visible = icon;
    });

const NetworkWifiIcon = (icon, tooltip) =>
    MaterialIcon(icon, "norm", {
        tooltipText: tooltip ? Network.wifi.bind("strength").as(s => `Network strength: ${s}/100`) : "",
    });

const NetworkWifiIndicator = tooltip =>
    Stack({
        transition: "slide_up_down",
        transitionDuration: 120,
        shown: Utils.merge([Network.wifi.bind("internet"), Network.wifi.bind("strength")], (internet, strength) =>
            internet === "connected" ? String(Math.ceil(strength / 25)) : internet
        ),
        children: {
            disabled: MaterialIcon("wifi_off", "norm"),
            disconnected: MaterialIcon("signal_wifi_off", "norm"),
            connecting: MaterialIcon("settings_ethernet", "norm"),
            0: NetworkWifiIcon("signal_wifi_0_bar", tooltip),
            1: NetworkWifiIcon("network_wifi_1_bar", tooltip),
            2: NetworkWifiIcon("network_wifi_2_bar", tooltip),
            3: NetworkWifiIcon("network_wifi_3_bar", tooltip),
            4: NetworkWifiIcon("signal_wifi_4_bar", tooltip),
        },
    });

export const NetworkIndicator = (tooltip = false) =>
    Stack({
        transition: "slide_up_down",
        transitionDuration: 120,
        shown: Network.bind("primary").as(p => p || "fallback"),
        children: {
            fallback: SimpleNetworkIndicator(),
            wifi: NetworkWifiIndicator(tooltip),
            wired: NetworkWiredIndicator(),
        },
    });

const HyprlandXkbKeyboardLayout = (useFlag = false) => {
    let initLangs = [];
    let languageStackArray = [];
    let currentKeyboard;

    const updateCurrentKeyboards = () => {
        currentKeyboard = JSON.parse(Hyprland.message("j/devices")).keyboards.find(
            device => device.name === "at-translated-set-2-keyboard"
        );
        if (currentKeyboard) initLangs = currentKeyboard.layout.split(",").map(lang => lang.trim());

        languageStackArray = Array.from({ length: initLangs.length }, (_, i) => {
            const lang = languages.find(lang => lang.layout == initLangs[i]);
            return lang
                ? {
                      [lang.layout]: Label({ label: useFlag ? lang.flag : lang.layout }),
                  }
                : {
                      [initLangs[i]]: Label({ label: initLangs[i] }),
                  };
        });
    };
    updateCurrentKeyboards();
    const widgetRevealer = Revealer({
        transition: "slide_left",
        transitionDuration: 120,
        revealChild: languageStackArray.length > 1,
    });
    const widgetKids = {
        ...languageStackArray.reduce((obj, lang) => {
            return { ...obj, ...lang };
        }, {}),
        undef: Label({ label: "?" }),
    };
    const widgetContent = Stack({
        transition: "slide_up_down",
        transitionDuration: 120,
        children: widgetKids,
        shown: Hyprland.bind("keyboard-layout").as((_, layout) => {
            if (!layout) return "undef";
            let lang = languages.find(l => layout.includes(l.name));
            if (lang) return lang.layout;
            else {
                lang = languageStackArray.find(l => isLanguageMatch(l[0], layout));
                return lang ? lang[0] : "undef";
            }
        }),
    });
    widgetRevealer.child = widgetContent;
    return widgetRevealer;
};

export const StatusIcons = (props = {}) =>
    Box({
        ...props,
        child: Box({
            className: "spacing-h-15",
            children: [
                LockIndicator(isCapsLockOn, "keyboard_capslock_badge"),
                LockIndicator(isNumLockOn, "filter_1"),
                VolumeMuteIndicator(),
                MicMuteIndicator(),
                HyprlandXkbKeyboardLayout(),
                NotificationIndicator(),
                NetworkIndicator(true),
                Box({
                    className: "spacing-h-5",
                    children: [BluetoothIndicator(true), BluetoothDevices()],
                }),
            ],
        }),
    });
