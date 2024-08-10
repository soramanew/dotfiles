import GLib from "gi://GLib";
const { Button, Stack } = Widget;
const { execAsync, exec } = Utils;
const Hyprland = await Service.import("hyprland");
const Bluetooth = await Service.import("bluetooth");
const Network = await Service.import("network");
import { BluetoothIndicator, NetworkIndicator } from "../.commonwidgets/statusicons.js";
import { setupCursorHover } from "../.widgetutils/cursorhover.js";
import { MaterialIcon } from "../.commonwidgets/materialicon.js";
import { sidebarOptionsStack } from "./sideright.js";
import { hasTouchscreen, inPath } from "../.miscutils/system.js";
import { tabletMode } from "../../variables.js";

export const ToggleIconWifi = (props = {}) =>
    Button({
        className: "txt-small sidebar-iconbutton",
        tooltipText: "Wifi | Right-click to configure",
        onClicked: Network.toggleWifi,
        onSecondaryClick: () => sidebarOptionsStack.focusName("Wifi networks"),
        onMiddleClick: () => {
            execAsync(
                inPath("gnome-control-center")
                    ? "gnome-control-center wifi"
                    : // Delete COLORTERM env var, rescan network connections, sleep if last command took less than 0.1s (so nmtui size and position loads properly)
                      "foot -T nmtui fish -c 'set -e COLORTERM ; nmcli device wifi rescan ; [ $CMD_DURATION -lt 100 ] && sleep (math 0.1 - $CMD_DURATION / 1000) ; TERM=xterm-old nmtui connect ; exit'"
            ).catch(print);
            closeEverything();
        },
        child: NetworkIndicator(),
        setup: self => {
            setupCursorHover(self);
            self.hook(Network, button => {
                button.toggleClassName(
                    "sidebar-button-active",
                    [Network.wifi?.internet, Network.wired?.internet].includes("connected")
                );
                button.tooltipText = `${Network.wifi?.ssid || "Wifi"} | Right-click to configure`;
            });
        },
        ...props,
    });

export const ToggleIconBluetooth = (props = {}) =>
    Button({
        className: "txt-small sidebar-iconbutton",
        tooltipText: "Bluetooth | Right-click to configure",
        onClicked: () => (Bluetooth.enabled = !Bluetooth.enabled),
        onSecondaryClick: () => sidebarOptionsStack.focusName("Bluetooth"),
        onMiddleClick: () => {
            execAsync("blueman-manager").catch(print);
            closeEverything();
        },
        child: BluetoothIndicator(),
        setup: self => {
            setupCursorHover(self);
            self.hook(
                Bluetooth,
                button => button.toggleClassName("sidebar-button-active", Bluetooth.enabled),
                "notify::enabled"
            );
        },
        ...props,
    });

export const HyprToggleIcon = (icon, name, hyprlandConfigValue, values = [0, 1], props = {}) =>
    Button({
        className: "txt-small sidebar-iconbutton",
        tooltipText: name,
        onClicked: button =>
            Hyprland.messageAsync(`j/getoption ${hyprlandConfigValue}`)
                .then(option => {
                    const isEnabled = JSON.parse(option).int == values[1];
                    Hyprland.messageAsync(`keyword ${hyprlandConfigValue} ${values[isEnabled ? 0 : 1]}`).catch(print);
                    button.toggleClassName("sidebar-button-active", !isEnabled);
                })
                .catch(print),
        child: MaterialIcon(icon, "norm", { hpack: "center" }),
        setup: button => {
            Hyprland.messageAsync(`j/getoption ${hyprlandConfigValue}`)
                .then(opt => button.toggleClassName("sidebar-button-active", JSON.parse(opt).int == values[1]))
                .catch(print);
            setupCursorHover(button);
        },
        ...props,
    });

export const ModuleNightLight = (props = {}) =>
    inPath("gammastep")
        ? Button({
              attribute: { enabled: false },
              className: "txt-small sidebar-iconbutton",
              tooltipText: "Night Light",
              onClicked: self => {
                  self.attribute.enabled = !self.attribute.enabled;
                  self.toggleClassName("sidebar-button-active", self.attribute.enabled);
                  if (self.attribute.enabled) execAsync("gammastep").catch(print);
                  else
                      execAsync("pkill gammastep")
                          .then(() => {
                              // disable the button until fully terminated to avoid race
                              self.sensitive = false;
                              const interval = setInterval(() => {
                                  execAsync("pkill -0 gammastep").catch(() => {
                                      self.sensitive = true;
                                      interval.destroy();
                                  });
                              }, 500);
                          })
                          .catch(print);
              },
              child: MaterialIcon("nightlight", "norm"),
              setup: self => {
                  setupCursorHover(self);
                  self.attribute.enabled = !!exec("pidof gammastep");
                  self.toggleClassName("sidebar-button-active", self.attribute.enabled);
              },
              ...props,
          })
        : null;

export const ModuleInvertColour = (props = {}) =>
    Button({
        className: "txt-small sidebar-iconbutton",
        tooltipText: "Colour inversion",
        onClicked: button => {
            Hyprland.messageAsync("j/getoption decoration:screen_shader")
                .then(output => {
                    const shaderPath = JSON.parse(output).str.trim();
                    if (shaderPath !== "[[EMPTY]]" && shaderPath !== "") {
                        Hyprland.messageAsync("keyword decoration:screen_shader [[EMPTY]]").catch(print);
                        button.toggleClassName("sidebar-button-active", false);
                    } else {
                        Hyprland.messageAsync(
                            `keyword decoration:screen_shader ${GLib.get_home_dir()}/.config/hypr/shaders/invert.frag`
                        ).catch(print);
                        button.toggleClassName("sidebar-button-active", true);
                    }
                })
                .catch(print);
        },
        child: MaterialIcon("invert_colors", "norm"),
        setup: setupCursorHover,
        ...props,
    });

export const ModuleRawInput = (props = {}) =>
    Button({
        className: "txt-small sidebar-iconbutton",
        tooltipText: "Raw input",
        onClicked: button => {
            Hyprland.messageAsync("j/getoption input:accel_profile")
                .then(output => {
                    const value = JSON.parse(output).str.trim();
                    if (value !== "[[EMPTY]]" && value !== "") {
                        Hyprland.messageAsync("keyword input:accel_profile [[EMPTY]]").catch(print);
                        button.toggleClassName("sidebar-button-active", false);
                    } else {
                        Hyprland.messageAsync(`keyword input:accel_profile flat`).catch(print);
                        button.toggleClassName("sidebar-button-active", true);
                    }
                })
                .catch(print);
        },
        child: MaterialIcon("mouse", "norm"),
        setup: setupCursorHover,
        ...props,
    });

export const ModuleIdleInhibitor = (props = {}) =>
    Button({
        attribute: { enabled: false },
        className: "txt-small sidebar-iconbutton",
        tooltipText: "Keep system awake",
        onClicked: self => {
            self.attribute.enabled = !self.attribute.enabled;
            self.toggleClassName("sidebar-button-active", self.attribute.enabled);
            if (self.attribute.enabled)
                execAsync([
                    "bash",
                    "-c",
                    `pidof wayland-idle-inhibitor.py || ${App.configDir}/scripts/wayland-idle-inhibitor.py`,
                ]).catch(print);
            else execAsync("pkill -f wayland-idle-inhibitor.py").catch(print);
        },
        child: MaterialIcon("coffee", "norm"),
        setup: self => {
            setupCursorHover(self);
            self.attribute.enabled = !!exec("pidof wayland-idle-inhibitor.py");
            self.toggleClassName("sidebar-button-active", self.attribute.enabled);
        },
        ...props,
    });

const Touchscreen = () => HyprToggleIcon("do_not_touch", "Disable touchscreen", "input:touchdevice:enabled", [1, 0]);

const AutoRotate = () =>
    Button({
        attribute: {
            enabled: false,
            update: (self, value = !self.attribute.enabled) => {
                self.attribute.enabled = value;
                self.toggleClassName("sidebar-button-active", value);
                if (value) execAsync(["pkill", "-CONT", "rot8"]).catch(print);
                else execAsync(["pkill", "-STOP", "rot8"]).catch(print);
            },
        },
        className: "txt-small sidebar-iconbutton",
        tooltipText: "Auto rotate",
        onClicked: self => self.attribute.update(self),
        child: MaterialIcon("crop_rotate", "norm"),
        setup: self => {
            setupCursorHover(self);
            self.hook(tabletMode, self.attribute.update);
        },
    });

export const ModuleTouchscreen = (props = {}) => {
    if (!hasTouchscreen) return null;
    if (inPath("rot8"))
        return Stack({
            transition: "slide_up_down",
            transitionDuration: 180,
            shown: tabletMode.bind().as(tb => (tb ? "rotate" : "touch")),
            children: {
                touch: Touchscreen(),
                rotate: AutoRotate(),
            },
            ...props,
        });
    return Touchscreen();
};

export const ModuleReloadIcon = (props = {}) => {
    const icon = MaterialIcon("refresh", "norm");
    let timeout;
    return Button({
        ...props,
        className: "txt-small sidebar-iconbutton",
        tooltipText: "Reload Hyprland config",
        onClicked: () =>
            Hyprland.messageAsync("reload")
                .then(() => {
                    icon.label = "done";
                    timeout?.destroy();
                    timeout = setTimeout(() => (icon.label = "refresh"), 3000);
                })
                .catch(print),
        child: icon,
        setup: setupCursorHover,
    });
};

export const ModuleSettingsIcon = (props = {}) =>
    inPath("gnome-control-center")
        ? Button({
              ...props,
              className: "txt-small sidebar-iconbutton",
              tooltipText: "Open Settings",
              onClicked: () => {
                  execAsync("gnome-control-center").catch(print);
                  closeEverything();
              },
              child: MaterialIcon("settings", "norm"),
              setup: setupCursorHover,
          })
        : null;

export const ModulePowerIcon = (props = {}) =>
    Button({
        ...props,
        className: "txt-small sidebar-iconbutton",
        tooltipText: "Session",
        onClicked: () => {
            closeEverything();
            Utils.timeout(1, () => App.openWindow("session"));
        },
        child: MaterialIcon("power_settings_new", "norm"),
        setup: setupCursorHover,
    });
