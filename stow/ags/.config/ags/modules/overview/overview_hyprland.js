import Gdk from "gi://Gdk";
import Gtk from "gi://Gtk";
const { Box, Label, Button, Icon, Menu, MenuItem, Revealer, EventBox, Overlay, CenterBox, Fixed } = Widget;
const { execAsync, subprocess } = Utils;
const Hyprland = await Service.import("hyprland");
import { setupCursorHoverGrab } from "../.widgetutils/cursorhover.js";
import { dumpToWorkspace, swapWorkspace } from "./actions.js";
import { substitute } from "../.miscutils/icons.js";
import { dispatch, range } from "../.miscutils/system.js";
import {
    SCREEN_HEIGHT,
    SCREEN_WIDTH,
    WS_PER_GROUP,
    OVERVIEW_ROWS as WS_ROWS,
    OVERVIEW_COLS as WS_COLS,
} from "../../constants.js";
import { Click2CloseRegion } from "../.commonwidgets/click2closeregion.js";
import { EXTENDED_BAR } from "../../constants.js";
import { stripInvisUnicode } from "../.miscutils/strings.js";

const OVERVIEW_SCALE = 0.15;
const OVERVIEW_WS_NUM_SCALE = 0.09;
const OVERVIEW_WS_NUM_MARGIN_SCALE = 0.07;
const TARGET = [Gtk.TargetEntry.new("text/plain", Gtk.TargetFlags.SAME_APP, 0)];

const overviewTick = Variable(false);

const paSinkInputs = Variable([]);
const updatePASinkInputs = () =>
    execAsync("pactl -f json list sink-inputs")
        .then(sinks => (paSinkInputs.value = JSON.parse(sinks)))
        .catch(print);
// Init update
updatePASinkInputs();
// Monitor pulseaudio events and update sinks on event
subprocess(["pactl", "-f", "json", "subscribe"], out => {
    if (JSON.parse(out).on === "sink-input") updatePASinkInputs();
});

const dispatchAndClose = dispatcher => {
    App.closeWindow("overview");
    return dispatch(dispatcher);
};
const getOffset = () => Math.floor((Hyprland.active.workspace.id - 1) / WS_PER_GROUP) * WS_PER_GROUP;
const calcCss = (w, h) =>
    `min-width: ${Math.round(w * OVERVIEW_SCALE)}px; min-height: ${Math.round(h * OVERVIEW_SCALE)}px;`;

const C2C = () => Click2CloseRegion({ name: "overview" });

export default () => {
    const clientMap = new Map();
    const ContextMenuWorkspaceArray = ({ label, actionFunc, thisWorkspace }) =>
        MenuItem({
            label: label,
            setup: menuItem => {
                const submenu = Menu({ className: "menu" });

                const startWorkspace = getOffset() + 1;
                const endWorkspace = startWorkspace + WS_PER_GROUP;
                for (let i = startWorkspace; i < endWorkspace; i++) {
                    if (i === thisWorkspace) continue;
                    const button = MenuItem({ label: `Workspace ${i}` });
                    button.connect("activate", () => {
                        actionFunc(thisWorkspace, i);
                        overviewTick.setValue(!overviewTick.value);
                    });
                    submenu.append(button);
                }
                menuItem.set_reserve_indicator(true);
                menuItem.set_submenu(submenu);
            },
        });

    const Window = (
        {
            address,
            at: [x, y],
            size: [w, h],
            workspace: { id, name },
            class: c,
            initialClass,
            title,
            initialTitle,
            pid,
            xwayland,
        },
        screenCoords,
        onClicked = () => dispatchAndClose(`focuswindow address:${address}`)
    ) => {
        title = stripInvisUnicode(title);

        // Non-primary monitors
        if (screenCoords.x !== 0) x -= screenCoords.x;
        if (screenCoords.y !== 0) y -= screenCoords.y;
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

        if (c.length === 0) c = initialClass;
        if (c.length === 0) c = stripInvisUnicode(initialTitle);

        if (w <= 0 || h <= 0 || (c === "" && title === "")) return null;

        const iconSize = Math.min(w, h) * OVERVIEW_SCALE;
        const appIcon = Icon({ icon: substitute(c), size: iconSize / 2.5 });
        const audioIcon = Label({
            hpack: "end",
            vpack: "start",
            className: "icon-material txt overview-tasks-window-audio-icon",
            label: "volume_up",
            setup: self => {
                let visible = false;
                self.hook(paSinkInputs, () => {
                    let sinkMatch = null;
                    for (const sink of paSinkInputs.value) {
                        // Check by pid (not all sink inputs have this tho)
                        const sPID = sink.properties["application.process.id"];
                        // sPID is a string for some reason while pid is a number
                        if (sPID == pid) {
                            sinkMatch = sink;
                            break;
                        }

                        // Check by media name vs window title
                        const lSinkName = sink.properties["media.name"].toLowerCase();
                        const lTitle = title.toLowerCase();
                        if (lSinkName.includes(lTitle) || lTitle.includes(lSinkName)) {
                            sinkMatch = sink;
                            break;
                        }

                        // Hardcoded mpv check, mpv titles are formatted with `<track title> - mpv` so check title
                        if (sink.properties["application.name"] === "mpv") {
                            const strippedSinkName = lSinkName.slice(0, -6);
                            if (strippedSinkName.includes(lTitle) || lTitle.includes(strippedSinkName)) {
                                sinkMatch = sink;
                                break;
                            }
                        }
                    }
                    // Window has matching sink input and is not corked, idk what corked means but it seems to represent play state?
                    // It works tho so... yes
                    self.visible = visible = sinkMatch !== null && !sinkMatch.corked;
                });

                // So when show_all is called on ancestor it retains visible state
                self.on("map", () => (self.visible = visible));
            },
            attribute: size =>
                (audioIcon.css = `font-size: ${size}px; min-width: ${size * 1.2}px; min-height: ${size * 1.2}px;`),
        });
        audioIcon.attribute(iconSize / 10);
        const menu = Menu({
            className: "menu",
            children: [
                MenuItem({
                    child: Label({
                        xalign: 0,
                        label: "Close (Middle-click)",
                    }),
                    onActivate: () => dispatch(`closewindow address:${address}`),
                }),
                MenuItem({
                    child: Label({
                        xalign: 0,
                        label: "Kill all windows in workspace",
                    }),
                    onActivate: () => {
                        const cmds = [];
                        for (const client of Hyprland.clients)
                            if (client.workspace.id === id) cmds.push(`dispatch closewindow address:${client.address}`);
                        Hyprland.messageAsync(`[[BATCH]]${cmds.join(";")}`).catch(print);
                    },
                }),
                ContextMenuWorkspaceArray({
                    label: "Dump windows to workspace",
                    actionFunc: dumpToWorkspace,
                    thisWorkspace: id,
                }),
                ContextMenuWorkspaceArray({
                    label: "Swap windows with workspace",
                    actionFunc: swapWorkspace,
                    thisWorkspace: id,
                }),
            ],
        });
        const windowTitle = Revealer({
            transition: "slide_down",
            transitionDuration: 150,
            revealChild: true,
            child: Label({
                maxWidthChars: 1, // Min width when ellipsizing (truncated)
                truncate: "end",
                className: `txt readingfont ${xwayland ? "txt-italic" : ""}`,
                css: `
                    font-size: ${
                        (Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * OVERVIEW_SCALE) / (EXTENDED_BAR ? 14.6 : 12)
                    }px;
                    margin: ${(Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * OVERVIEW_SCALE) / 20}px;
                `,
                // If the title is too short, include the class
                label: title.length <= 1 ? `${c}: ${title}` : title,
            }),
        });

        return Button({
            attribute: {
                address,
                x,
                y,
                w,
                h,
                ws: id,
                wsName: name,
                updateIconSize: self => {
                    const iconSize = Math.min(self.attribute.w, self.attribute.h) * OVERVIEW_SCALE;
                    appIcon.size = iconSize / 2.5;
                    audioIcon.attribute(iconSize / 10);
                },
                updateSize: (self, w, h) => {
                    self.attribute.w = w;
                    self.attribute.h = h;
                    self.attribute.updateIconSize(self);
                    self.css = calcCss(w, h);
                },
            },
            className: "overview-tasks-window",
            css: calcCss(w, h),
            onClicked: onClicked,
            onMiddleClickRelease: () => dispatch(`closewindow address:${address}`),
            onSecondaryClick: button => menu.popup_at_widget(button, Gdk.Gravity.SOUTH, Gdk.Gravity.NORTH, null),
            child: Box({
                homogeneous: true,
                child: Box({
                    vertical: true,
                    vpack: "center",
                    className: "spacing-v-5",
                    children: [
                        Overlay({ hpack: "center", passThrough: true, child: appIcon, overlays: [audioIcon] }),
                        windowTitle,
                    ],
                }),
            }),
            tooltipText: `${c}: ${title}`,
            setup: button => {
                setupCursorHoverGrab(button);

                button.drag_source_set(Gdk.ModifierType.BUTTON1_MASK, TARGET, Gdk.DragAction.MOVE);
                button.drag_source_set_icon_name(substitute(c));

                // On drag start, add the dragging class
                button.connect("drag-begin", button => button.toggleClassName("overview-tasks-window-dragging", true));
                // On drag finish, give address
                button.connect("drag-data-get", (_w, _c, data) => {
                    data.set_text(address, address.length);
                    button.toggleClassName("overview-tasks-window-dragging", false);
                });

                // Remove from client map when destroyed
                button.connect("destroy", () => {
                    if (clientMap.get(address) === button) clientMap.delete(address);
                });

                // Attach menu so inherit styles + gets destroyed when window destroyed
                menu.attach_to_widget(button, null);

                // Hide title when window too small
                button.connect("size-allocate", () => {
                    windowTitle.revealChild =
                        Math.round(button.attribute.h * OVERVIEW_SCALE) + 2 >=
                        appIcon.get_allocated_height() + windowTitle.child.get_allocated_height();
                });
            },
        });
    };

    const Workspace = index => {
        const fixed = Fixed();
        const WorkspaceNumber = () =>
            Label({
                hpack: "start",
                vpack: "start",
                className: "overview-tasks-workspace-number",
                label: String(index),
                css: `
                    margin: ${Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * OVERVIEW_SCALE * OVERVIEW_WS_NUM_MARGIN_SCALE}px;
                    font-size: ${SCREEN_HEIGHT * OVERVIEW_SCALE * OVERVIEW_WS_NUM_SCALE}px;
                `,
                setup: self =>
                    self.hook(Hyprland.active.workspace, self => {
                        // Update when going to new ws group
                        const currentGroup = Math.floor((Hyprland.active.workspace.id - 1) / WS_PER_GROUP);
                        self.label = `${currentGroup * WS_PER_GROUP + index}`;
                    }),
            });
        const widget = Box({
            className: "overview-tasks-workspace",
            vpack: "center",
            css: calcCss(SCREEN_WIDTH, SCREEN_HEIGHT),
            children: [
                EventBox({
                    hexpand: true,
                    onPrimaryClick: () => dispatchAndClose(`workspace ${index}`),
                    setup: eventbox => {
                        eventbox.drag_dest_set(Gtk.DestDefaults.ALL, TARGET, Gdk.DragAction.COPY);
                        eventbox.connect("drag-data-received", (_w, _c, _x, _y, data) => {
                            dispatch(`movetoworkspacesilent ${index + getOffset()},address:${data.get_text()}`);
                            overviewTick.setValue(!overviewTick.value);
                        });
                    },
                    child: Overlay({
                        child: Box(),
                        overlays: [fixed, WorkspaceNumber()],
                    }),
                }),
            ],
        });
        widget.clear = () => {
            const offset = getOffset();
            clientMap.forEach((client, address) => {
                if (!client) return;
                if (
                    client.attribute.ws <= offset ||
                    client.attribute.ws > offset + WS_PER_GROUP ||
                    client.attribute.ws == offset + index
                ) {
                    client.destroy();
                    clientMap.delete(address);
                }
            });
        };
        widget.set = (clientJson, screenCoords) => {
            const c = clientMap.get(clientJson.address);
            if (c) {
                if (c.attribute?.ws !== clientJson.workspace.id) {
                    c.destroy();
                    clientMap.delete(clientJson.address);
                } else if (c) {
                    c.attribute.updateSize(c, ...clientJson.size);
                    fixed.move(
                        c,
                        Math.max(0, clientJson.at[0] * OVERVIEW_SCALE),
                        Math.max(0, clientJson.at[1] * OVERVIEW_SCALE)
                    );
                    return;
                }
            }
            const newWindow = Window(clientJson, screenCoords);
            if (newWindow === null) return;
            fixed.put(
                newWindow,
                Math.max(0, newWindow.attribute.x * OVERVIEW_SCALE),
                Math.max(0, newWindow.attribute.y * OVERVIEW_SCALE)
            );
            clientMap.set(clientJson.address, newWindow);
        };
        widget.unset = clientAddress => {
            const c = clientMap.get(clientAddress);
            if (!c) return;
            c.destroy();
            clientMap.delete(clientAddress);
        };
        widget.show = fixed.show_all;
        return widget;
    };

    const OverviewRow = ({ startWorkspace, workspaces }) =>
        Box({
            children: range(workspaces, startWorkspace).map(Workspace),
            attribute: {
                monitorMap: [],
                getMonitorMap: box =>
                    (box.attribute.monitorMap = JSON.parse(Hyprland.message("j/monitors")).reduce((acc, item) => {
                        acc[item.id] = { x: item.x, y: item.y };
                        return acc;
                    }, {})),
                update: box => {
                    if (!App.getWindow("overview").visible) return;
                    const offset = getOffset();
                    const kids = box.get_children();
                    kids.forEach(kid => kid.clear());
                    for (const client of JSON.parse(Hyprland.message("j/clients"))) {
                        const childID = client.workspace.id - (offset + startWorkspace);
                        if (offset + startWorkspace <= client.workspace.id <= offset + startWorkspace + workspaces) {
                            const screenCoords = box.attribute.monitorMap[client.monitor];
                            kids[childID]?.set(client, screenCoords);
                        }
                    }
                    kids.forEach(kid => kid.show());
                },
                updateWorkspace: (box, id) => {
                    // Not in range, ignore
                    const offset = getOffset();
                    if (!(offset + startWorkspace <= id <= offset + startWorkspace + workspaces)) return;
                    const kids = box.get_children();
                    for (const client of JSON.parse(Hyprland.message("j/clients"))) {
                        if (client.workspace.id !== id) continue;
                        const screenCoords = box.attribute.monitorMap[client.monitor];
                        kids[id - (offset + startWorkspace)]?.set(client, screenCoords);
                    }
                    kids[id - (offset + startWorkspace)]?.show();
                },
            },
            setup: box => {
                box.attribute.getMonitorMap(box);
                box.hook(overviewTick, box => box.attribute.update(box))
                    .hook(
                        Hyprland,
                        (box, clientAddress) => {
                            const ws = clientMap.get(clientAddress)?.attribute.ws;
                            if (!ws) return;

                            box.attribute.updateWorkspace(box, ws);
                            box.get_children()[ws - (getOffset() + startWorkspace)]?.unset(clientAddress);
                        },
                        "client-removed"
                    )
                    .hook(
                        Hyprland,
                        (box, clientAddress) => {
                            const client = Hyprland.getClient(clientAddress);
                            if (!client) return;
                            box.attribute.updateWorkspace(box, client.workspace.id);
                        },
                        "client-added"
                    )
                    .hook(Hyprland.active.workspace, box => {
                        // Full update when going to new ws group
                        const previousGroup = box.attribute.workspaceGroup;
                        const currentGroup = Math.floor((Hyprland.active.workspace.id - 1) / WS_PER_GROUP);
                        if (currentGroup !== previousGroup) {
                            box.attribute.update(box);
                            box.attribute.workspaceGroup = currentGroup;
                            overviewTick.setValue(!overviewTick.value);
                        }
                    })
                    .hook(App, (box, name, visible) => {
                        // Update on open
                        if (name == "overview" && visible) box.attribute.update(box);
                    });
            },
        });

    const SpecialWorkspace = name => {
        const fixed = Fixed();
        const WorkspaceName = () =>
            Label({
                hpack: "start",
                vpack: "start",
                className: "overview-tasks-workspace-number",
                label: name.replace("special:", ""),
                css: `
                    margin: ${Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * OVERVIEW_SCALE * OVERVIEW_WS_NUM_MARGIN_SCALE}px;
                    font-size: ${SCREEN_HEIGHT * OVERVIEW_SCALE * OVERVIEW_WS_NUM_SCALE}px;
                `,
            });
        const widget = Box({
            className: "overview-tasks-workspace",
            vpack: "center",
            css: calcCss(SCREEN_WIDTH, SCREEN_HEIGHT),
            attribute: { name },
            children: [
                EventBox({
                    hexpand: true,
                    onPrimaryClick: () => dispatchAndClose(`togglespecialworkspace ${name.replace("special:", "")}`),
                    setup: eventbox => {
                        eventbox.drag_dest_set(Gtk.DestDefaults.ALL, TARGET, Gdk.DragAction.COPY);
                        eventbox.connect("drag-data-received", (_w, _c, _x, _y, data) => {
                            dispatch(`movetoworkspacesilent ${name},address:${data.get_text()}`);
                            overviewTick.setValue(!overviewTick.value);
                        });
                    },
                    child: Overlay({
                        child: Box({}),
                        overlays: [fixed, WorkspaceName()],
                    }),
                }),
            ],
        });
        widget.clear = () => {
            clientMap.forEach((client, address) => {
                if (!client) return;
                if (client.attribute.wsName === name) {
                    client.destroy();
                    clientMap.delete(address);
                }
            });
        };
        widget.set = (clientJson, screenCoords) => {
            const c = clientMap.get(clientJson.address);
            if (c) {
                if (c.attribute?.wsName !== clientJson.workspace.name) {
                    c.destroy();
                    clientMap.delete(clientJson.address);
                } else if (c) {
                    c.attribute.updateSize(c, ...clientJson.size);
                    fixed.move(
                        c,
                        Math.max(0, clientJson.at[0] * OVERVIEW_SCALE),
                        Math.max(0, clientJson.at[1] * OVERVIEW_SCALE)
                    );
                    return;
                }
            }
            const newWindow = Window(clientJson, screenCoords, () =>
                dispatchAndClose(`togglespecialworkspace ${name.replace("special:", "")}`)
            );
            if (newWindow === null) return;
            fixed.put(
                newWindow,
                Math.max(0, newWindow.attribute.x * OVERVIEW_SCALE),
                Math.max(0, newWindow.attribute.y * OVERVIEW_SCALE)
            );
            clientMap.set(clientJson.address, newWindow);
        };
        widget.unset = clientAddress => {
            const c = clientMap.get(clientAddress);
            if (!c) return;
            c.destroy();
            clientMap.delete(clientAddress);
        };
        widget.isEmpty = () => {
            for (const [, client] of clientMap) {
                if (client && client.attribute.wsName === name) return false;
            }
            return true;
        };
        widget.show = fixed.show_all;
        return widget;
    };
    const specialWorkspaces = [];
    const SpecialWorkspaceRow = (row, workspace) =>
        Box({
            attribute: {
                monitorMap: [],
                getMonitorMap: box =>
                    (box.attribute.monitorMap = JSON.parse(Hyprland.message("j/monitors")).reduce((acc, item) => {
                        acc[item.id] = { x: item.x, y: item.y };
                        return acc;
                    }, {})),
                update: box => {
                    if (!App.getWindow("overview").visible) return;
                    const kids = box.get_children();
                    kids.forEach(kid => kid.clear());
                    for (const client of JSON.parse(Hyprland.message("j/clients"))) {
                        if (specialWorkspaces[row].has(client.workspace.name)) {
                            const screenCoords = box.attribute.monitorMap[client.monitor];
                            kids[specialWorkspaces[row].get(client.workspace.name)].set(client, screenCoords);
                        }
                    }
                    kids.forEach(kid => kid.show());
                },
                updateWorkspace: (box, name) => {
                    // Not in this row, ignore
                    if (!specialWorkspaces[row].has(name)) return;

                    const ws = box.get_children()[specialWorkspaces[row].get(name)];
                    for (const client of JSON.parse(Hyprland.message("j/clients"))) {
                        if (client.workspace.name !== name) continue;
                        const screenCoords = box.attribute.monitorMap[client.monitor];
                        ws.set(client, screenCoords);
                    }
                    if (ws.isEmpty()) box.attribute.removeWorkspace(box, ws.attribute.name);
                    else ws.show();
                },
                addWorkspace: (self, ws) => {
                    specialWorkspaces[row].set(ws.attribute.name, self.get_children().length);
                    self.pack_start(ws, false, false, 0);
                    self.show_all();
                },
                removeWorkspace: (self, ws) => {
                    const index = specialWorkspaces[row].get(ws);
                    specialWorkspaces[row].delete(ws);
                    self.get_children()[index].destroy();
                    specialWorkspaces[row].forEach((v, k) => {
                        if (v > index) specialWorkspaces[row].set(k, v - 1);
                    });
                },
            },
            setup: box => {
                specialWorkspaces[row] = new Map();
                box.attribute.addWorkspace(box, workspace);
                box.attribute.getMonitorMap(box);
                box.hook(overviewTick, box => box.attribute.update(box))
                    .hook(
                        Hyprland,
                        (box, clientAddress) => {
                            const ws = clientMap.get(clientAddress)?.attribute.wsName;
                            if (!ws) return;

                            box.attribute.updateWorkspace(box, ws);
                            box.get_children()[specialWorkspaces[row].get(ws)]?.unset(clientAddress);
                        },
                        "client-removed"
                    )
                    .hook(
                        Hyprland,
                        (box, clientAddress) => {
                            const client = Hyprland.getClient(clientAddress);
                            if (!client) return;
                            box.attribute.updateWorkspace(box, client.workspace.name);
                        },
                        "client-added"
                    )
                    .hook(App, (box, name, visible) => {
                        // Update on open
                        if (name == "overview" && visible) box.attribute.update(box);
                    });
            },
        });

    const SpecialWorkspaces = () =>
        Box({
            vertical: true,
            className: "overview-tasks",
            setup: self => {
                const addWs = name => {
                    if (name?.startsWith("special:")) {
                        if (!specialWorkspaces.length || specialWorkspaces.at(-1).size >= WS_COLS)
                            self.add(SpecialWorkspaceRow(specialWorkspaces.length, SpecialWorkspace(name)));
                        else {
                            const child = self.get_children().at(-1);
                            child.attribute.addWorkspace(child, SpecialWorkspace(name));
                        }
                    }
                };
                JSON.parse(Hyprland.message("j/workspaces")).forEach(ws => addWs(ws.name));
                self.hook(Hyprland, (_, name) => addWs(name), "workspace-added");
                self.hook(
                    Hyprland,
                    (_, name) => {
                        if (name?.startsWith("special:")) {
                            const child = self.get_children()[specialWorkspaces.findIndex(ws => ws.has(name))];
                            child.attribute.removeWorkspace(child, name);
                        }
                    },
                    "workspace-removed"
                );
            },
        });

    return Revealer({
        transition: "slide_down",
        transitionDuration: 200,
        revealChild: true,
        child: Box({
            vertical: true,
            children: [
                CenterBox({
                    vexpand: false,
                    startWidget: C2C(),
                    centerWidget: Box({
                        vertical: true,
                        className: "overview-tasks",
                        children: range(WS_ROWS, 0).map(i =>
                            OverviewRow({
                                startWorkspace: 1 + i * WS_COLS,
                                workspaces: WS_COLS,
                            })
                        ),
                    }),
                    endWidget: C2C(),
                }),
                Revealer({
                    transition: "slide_down",
                    transitionDuration: 200,
                    revealChild: Hyprland.bind("workspaces").as(
                        wss => wss.filter(ws => ws.name.startsWith("special:")).length > 0
                    ),
                    child: CenterBox({
                        vexpand: false,
                        startWidget: C2C(),
                        centerWidget: SpecialWorkspaces(),
                        endWidget: C2C(),
                    }),
                }),
            ],
        }),
    });
};
