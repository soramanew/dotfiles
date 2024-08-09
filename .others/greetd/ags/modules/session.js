const { Box, Button, Revealer, Label, Icon } = Widget;
const Battery = await Service.import("battery");
import { CACHE_DIR, setupCursorHover } from "../lib.js";

const parseSession = session =>
    Object.fromEntries(
        session
            .split("\n")
            .slice(1)
            .map(i => {
                const split = i.split("=", 2);
                return [split[0].toLowerCase(), split[1]]; // Keys are normally uppercase
            })
    );

const getLastSession = () => {
    try {
        return JSON.parse(Utils.readFile(`${CACHE_DIR}/last-session.txt`));
    } catch {
        return sessions[0];
    }
};

// Compare by value not ref
const objEq = (o1, o2) => JSON.stringify(o1) === JSON.stringify(o2);

const sessions = Utils.exec("find /usr/share/wayland-sessions -maxdepth 1 -type f -name '*.desktop'")
    .split("\n")
    .map(Utils.readFile)
    .map(parseSession);
export const session = Variable(getLastSession());

const SessionDropdown = () => {
    const SessionButton = s =>
        Button({
            className: "dropdown-btn",
            tooltipText: s.comment,
            child: Label(s.name),
            onClicked: () => {
                dropdown.revealChild = false;
                currentSession.toggleClassName("dropdown-title-open", false);
                session.value = s;
            },
            setup: setupCursorHover,
        });

    // TODO: dropdown element hitbox sizes are weird
    const dropdown = Revealer({
        transition: "slide_up",
        transitionDuration: 180,
        revealChild: false,
        child: Box({
            vertical: true,
            children: session.bind().as(c => sessions.filter(s => !objEq(s, c)).map(SessionButton)),
        }),
    });

    const currentSession = Button({
        className: "dropdown-btn dropdown-title",
        tooltipText: session.bind().as(s => s.comment),
        child: Box({
            hpack: "center",
            children: [
                Label({ label: session.bind().as(s => s.name) }),
                Label({ className: "session-icon", label: "desktop_windows" }),
            ],
        }),
        onClicked: () => {
            dropdown.revealChild = !dropdown.revealChild;
            currentSession.toggleClassName("dropdown-title-open", dropdown.revealChild);
        },
        setup: setupCursorHover,
    });

    return Box({
        vertical: true,
        vpack: "end",
        className: "session-chip",
        children: [dropdown, currentSession],
    });
};

const PowerDropdown = () => {
    const PowerButton = (icon, desc, cmd) =>
        Button({
            className: "dropdown-btn power-btn",
            tooltipText: desc,
            child: Label(icon),
            onClicked: () => Utils.execAsync(cmd).catch(print),
            setup: setupCursorHover,
        });

    const dropdown = Revealer({
        transition: "slide_up",
        transitionDuration: 180,
        revealChild: false,
        child: Box({
            vertical: true,
            children: [
                PowerButton("sleep", "Suspend", "systemctl suspend-then-hibernate"),
                PowerButton("download", "Hibernate", "systemctl hibernate"),
                PowerButton("power_settings_new", "Shutdown", "systemctl poweroff"),
                PowerButton("restart_alt", "Reboot", "systemctl reboot"),
            ],
        }),
    });

    const title = Button({
        className: "dropdown-btn dropdown-title power-btn",
        tooltipText: "Power menu",
        child: Label("power_settings_new"),
        onClicked: () => {
            dropdown.revealChild = !dropdown.revealChild;
            title.toggleClassName("dropdown-title-open", dropdown.revealChild);
        },
        setup: setupCursorHover,
    });

    return Box({
        vertical: true,
        vpack: "end",
        className: "session-chip power-dropdown",
        children: [dropdown, title],
    });
};

const BatteryStatus = () =>
    Box({
        vpack: "end",
        className: Utils.merge(
            [Battery.bind("percent"), Battery.bind("charging")],
            (p, c) => `session-chip ${!c && p <= 20 ? "battery-low" : ""}`
        ),
        visible: Battery.bind("available"),
        children: [
            Icon({ className: "battery-icon", icon: Battery.bind("icon-name") }),
            Label({ label: Battery.bind("percent").as(p => `${p}%`) }),
        ],
    });

export default () =>
    Box({
        hpack: "end",
        vpack: "end",
        className: "session",
        children: [BatteryStatus(), SessionDropdown(), PowerDropdown()],
    });
