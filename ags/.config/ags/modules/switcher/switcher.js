import Gtk from "gi://Gtk";
import Pango from "gi://Pango";
const { Box, Label, Button, Icon, Revealer } = Widget;
const Hyprland = await Service.import("hyprland");
import { substitute } from "../.miscutils/icons.js";
import { CACHE_DIR, SCREEN_HEIGHT, SCREEN_WIDTH } from "../../constants.js";
import { setupCursorHover } from "../.widgetutils/cursorhover.js";
import { dispatch } from "../.miscutils/system.js";
import { stripInvisUnicode } from "../.miscutils/strings.js";
import GradientScrollable from "../.commonwidgets/gradientscrollable.js";

const PREVIEW_SCALE = 0.15;

const monitorMap = JSON.parse(Hyprland.message("j/monitors")).reduce((acc, item) => {
    acc[item.id] = { x: item.x, y: item.y };
    return acc;
}, {});

const getIconName = ({ class: c, initialClass, initialTitle }) =>
    substitute(c || initialClass || stripInvisUnicode(initialTitle));

const getFullscreenStr = fs => {
    let state = "";
    if (fs === 1) state = "maximised";
    else if (fs === 2) state = "fullscreen";
    else if (fs === 3) state = "maximised and fullscreen";
    else return "";
    return ` (${state})`;
};

const Window = client => {
    let {
        at: [x, y],
        size: [w, h],
        class: c,
        title,
        monitor,
    } = client;
    title = stripInvisUnicode(title);

    if (w <= 0 || h <= 0 || (c === "" && title === "")) return null;

    // Non-primary monitors
    const monitorCoords = monitorMap[monitor];
    if (monitorCoords.x !== 0) x -= monitorCoords.x;
    if (monitorCoords.y !== 0) y -= monitorCoords.y;

    // Other offscreen adjustments
    if (x + w <= 0) x += Math.floor(x / SCREEN_WIDTH) * SCREEN_WIDTH;
    else if (x < 0) {
        w = x + w;
        x = 0;
    }
    if (y + h <= 0) x += Math.floor(y / SCREEN_HEIGHT) * SCREEN_HEIGHT;
    else if (y < 0) {
        h = y + h;
        y = 0;
    }

    // Truncate if offscreen
    if (x + w > SCREEN_WIDTH) w = SCREEN_WIDTH - x;
    if (y + h > SCREEN_HEIGHT) h = SCREEN_HEIGHT - y;

    return Box({
        attribute: client,
        className: "switcher-window",
        hpack: "start",
        vpack: "start",
        css: `
            margin-left: ${Math.round(x * PREVIEW_SCALE)}px;
            margin-top: ${Math.round(y * PREVIEW_SCALE)}px;
            margin-right: -${Math.round((x + w) * PREVIEW_SCALE)}px;
            margin-bottom: -${Math.round((y + h) * PREVIEW_SCALE)}px;
        `,
        homogeneous: true, // Centers the icon somehow
        child: Icon({ icon: getIconName(client), size: (Math.min(w, h) * PREVIEW_SCALE) / 2.5 }),
    });
};

export default () => {
    const currentWindow = Variable();

    let altTabOpened = false;
    globalThis.openSwitcher = () => {
        App.openWindow("switcher");
        altTabOpened = true;
    };

    const preview = Box({
        className: "switcher-workspace",
        vpack: "center",
        setup: self => {
            self.hook(currentWindow, () => {
                if (JSON.stringify(self.child?.attribute) !== JSON.stringify(currentWindow.value)) {
                    self.child?.destroy();
                    self.pack_start(Window(currentWindow.value), false, false, 0);
                    self.show_all();
                }
            });

            // Handle wallpaper changes
            const setCss = () =>
                (self.css = `
                    min-width: ${SCREEN_WIDTH * PREVIEW_SCALE}px;
                    min-height: ${SCREEN_HEIGHT * PREVIEW_SCALE}px;
                    background-image: url("${CACHE_DIR}/user/wallpaper/currentwall");
                `);
            setCss();
            const monitor = Utils.monitorFile(`${CACHE_DIR}/user/wallpaper/currentwall`, setCss);
            self.connect("destroy", () => monitor.cancel());
        },
    });

    const details = Box({
        vertical: true,
        className: "switcher-details",
        children: [
            Label({
                className: "txt-title-small",
                label: currentWindow.bind().as(w => stripInvisUnicode(w?.title) || "No title"),
                selectable: true,
                justification: "center",
                wrap: true,
                wrapMode: Pango.WrapMode.WORD_CHAR,
                maxWidthChars: 1,
            }),
            Label({
                className: "txt-subtext txt-norm",
                label: currentWindow.bind().as(w => `${w?.class || "No class"}${w?.xwayland ? " (xwayland)" : ""}`),
                selectable: true,
                justification: "center",
                wrap: true,
                wrapMode: Pango.WrapMode.WORD_CHAR,
                maxWidthChars: 1,
            }),
            Box({ className: "separator-line margin-top-5 margin-bottom-5" }),
            Label({
                className: "readingfont",
                label: currentWindow.bind().as(
                    w => `Address: ${w?.address.slice(2)} with pid ${w?.pid}
Position: ${w?.at.join(", ")} on monitor ${w?.monitor}
Size: ${w?.size.join("x")}
Workspace: ${w?.workspace.name} (${w?.workspace.id})
State: ${w?.floating ? "floating" : "tiled"}${getFullscreenStr(w?.fullscreen)}${w?.pinned ? " (pinned)" : ""}${
                        w?.initialClass ? "\nInitial class: " + w.initialClass : ""
                    }${
                        stripInvisUnicode(w?.initialTitle)
                            ? "\nInitial title: " + stripInvisUnicode(w.initialTitle)
                            : ""
                    }`
                ),
                selectable: true,
            }),
        ],
    });

    const activateButton = Button({
        hpack: "center",
        className: "switcher-activate-btn",
        child: Label("Focus window"),
        canFocus: false, // Prevent tab switching to it
        onClicked: () => {
            App.closeWindow("switcher");
            if (!currentWindow.value) return;
            // If client is on special workspace and not already on it
            const currentWs = JSON.parse(Hyprland.message("j/activewindow")).workspace?.name;
            if (
                currentWindow.value.workspace.name.startsWith("special:") &&
                currentWs !== currentWindow.value.workspace.name
            )
                Hyprland.message(
                    `dispatch togglespecialworkspace ${currentWindow.value.workspace.name.replace("special:", "")}`
                );
            // Window not on current special ws and currently on special ws
            else if (currentWs?.startsWith("special:") && !currentWindow.value.workspace.name.startsWith("special:"))
                Hyprland.message(`dispatch togglespecialworkspace ${currentWs.replace("special:", "")}`);
            // Bring to top and focus window, delay because doesn't focus if not
            Utils.timeout(10, () => {
                dispatch(`alterzorder top,address:${currentWindow.value.address}`);
                dispatch(`focuswindow address:${currentWindow.value.address}`);
            });
        },
    });

    const view = Box({
        vertical: true,
        className: "switcher-view",
        children: [preview, details, activateButton],
    });

    const Client = client =>
        Button({
            className: "switcher-list-window txt",
            child: Box({
                children: [
                    Box({
                        className: "switcher-list-icon",
                        homogeneous: true,
                        child: Icon({ icon: getIconName(client) }),
                    }),
                    Label({
                        className: "switcher-list-txt txt txt-norm",
                        label: stripInvisUnicode(client.title),
                        truncate: "end",
                        xalign: 0,
                    }),
                    Revealer({
                        transition: "slide_left",
                        transitionDuration: 150,
                        revealChild: stripInvisUnicode(client.title).length <= 20,
                        child: Label({
                            className: "txt-subtext txt-norm",
                            label: `@ ${client.at.join(", ")} ${client.size.join("x")}`,
                            truncate: "end",
                            xalign: 0,
                        }),
                    }),
                ],
            }),
            setup: self => {
                setupCursorHover(self);
                self.on("focus-in-event", () => (currentWindow.value = client));

                // For Hyprland keybind
                globalThis.moveSwitcherFocus = () => self.emit("move-focus", Gtk.DirectionType.GTK_DIR_TAB_FORWARD);

                // Handle enter press
                self.on("key-press-event", (_, event) => {
                    if (event.get_keyval()[1] === 65293) activateButton.clicked();
                });

                // Handle alt release
                self.on("key-release-event", (_, event) => {
                    if (altTabOpened && event.get_keyval()[1] === 65513) activateButton.clicked();
                });
            },
        });

    const list = Box({
        className: "switcher-list",
        child: GradientScrollable({
            layer: 1,
            child: Box({
                vertical: true,
                setup: self => {
                    const update = () => {
                        self.children = JSON.parse(Hyprland.message("j/clients"))
                            .sort((a, b) => a.focusHistoryID - b.focusHistoryID)
                            .map(Client);
                        // Make 2nd child grab focus if exists, else first child
                        (self.children[1] || self.children[0])?.grab_focus();
                    };
                    self.hook(Hyprland, update, "client-added").hook(Hyprland, update, "client-removed");
                    self.hook(
                        App,
                        (_, name, visible) => {
                            if (name === "switcher") {
                                if (visible) update();
                                else altTabOpened = false;
                            }
                        },
                        "window-toggled"
                    );
                },
            }),
        }),
    });

    return Box({ className: "switcher-bg", children: [view, list] });
};
