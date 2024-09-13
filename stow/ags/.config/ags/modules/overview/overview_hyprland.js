import Gdk from "gi://Gdk";
import Gtk from "gi://Gtk";
import GdkPixbuf from "gi://GdkPixbuf";
const { Box, Label, Button, Icon, Menu, MenuItem, Revealer, EventBox, Overlay, CenterBox } = Widget;
const { CACHE_DIR, execAsync } = Utils;
const Hyprland = await Service.import("hyprland");
const Mpris = await Service.import("mpris");
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
import { fileExists } from "../.miscutils/files.js";

const Image = Widget.subclass(Gtk.Image);

const OVERVIEW_SCALE = 0.15;
const OVERVIEW_WS_NUM_SCALE = 0.09;
const OVERVIEW_WS_NUM_MARGIN_SCALE = 0.07;
const TARGET = [Gtk.TargetEntry.new("text/plain", Gtk.TargetFlags.SAME_APP, 0)];

const overviewTick = Variable(false);
App.connect("window-toggled", (_, name, visible) => {
    if (visible && name === "overview") overviewTick.setValue(!overviewTick.value);
});

const dispatchAndClose = dispatcher => {
    App.closeWindow("overview");
    return execAsync(`${App.configDir}/scripts/hyprland/ws_wrapper.sh -n ${dispatcher}`).catch(print);
};
const getOffset = () => Math.floor((Hyprland.active.workspace.id - 1) / WS_PER_GROUP) * WS_PER_GROUP;
const calcCss = (x, y, w, h) => `
    margin-left: ${Math.round(x * OVERVIEW_SCALE)}px;
    margin-top: ${Math.round(y * OVERVIEW_SCALE)}px;
    margin-right: -${Math.round((x + w) * OVERVIEW_SCALE)}px;
    margin-bottom: -${Math.round((y + h) * OVERVIEW_SCALE)}px;
`;

const C2C = () => Click2CloseRegion({ name: "overview" });

export default () => {
    const clientMap = new Map();
    const ContextMenuWorkspaceArray = ({ label, actionFunc, thisWorkspace }) =>
        MenuItem({
            label: label,
            setup: menuItem => {
                const submenu = Menu({ className: "menu" });

                const startWorkspace = getOffset() + 1;
                const endWorkspace = startWorkspace + WS_PER_GROUP - 1;
                for (let i = startWorkspace; i <= endWorkspace; i++) {
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
            xwayland,
        },
        screenCoords,
        workspace,
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
        const volumeIcon = Label({
            hpack: "end",
            vpack: "start",
            className: "icon-material txt overview-tasks-window-volume-icon",
            label: "volume_up",
            setup: self =>
                self.hook(Mpris, () => {
                    self.visible =
                        Mpris.players.find(p => {
                            const pName = p.name.toLowerCase();
                            const cName = c.toLowerCase();
                            return pName.includes(cName) || cName.includes(pName);
                        })?.playBackStatus === "Playing";
                }),
            attribute: size =>
                (volumeIcon.css = `font-size: ${size}px; min-width: ${size * 1.2}px; min-height: ${size * 1.2}px;`),
        });
        volumeIcon.attribute(iconSize / 10);

        const content = Box({
            homogeneous: true,
            child: Box({
                vertical: true,
                vpack: "center",
                className: "spacing-v-5",
                children: [
                    Overlay({ hpack: "center", passThrough: true, child: appIcon, overlays: [volumeIcon] }),
                    Label({
                        // hexpand: true,
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
                ],
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
                    volumeIcon.attribute(iconSize / 10);
                },
            },
            className: "overview-tasks-window",
            hpack: "start",
            vpack: "start",
            css: calcCss(x, y, w, h),
            onClicked: onClicked,
            onMiddleClickRelease: () => dispatch(`closewindow address:${address}`),
            onSecondaryClick: button => {
                button.toggleClassName("overview-tasks-window-selected", true);
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
                menu.connect("deactivate", () => button.toggleClassName("overview-tasks-window-selected", false));
                menu.connect("selection-done", () => button.toggleClassName("overview-tasks-window-selected", false));
                menu.popup_at_widget(button.get_parent(), Gdk.Gravity.SOUTH, Gdk.Gravity.NORTH, null); // Show menu below the button
                button.connect("destroy", () => menu.destroy());
            },
            tooltipText: `${c}: ${title}`,
            setup: button => {
                setupCursorHoverGrab(button);

                // No icon and title when has preview
                button.hook(workspace.hasPreview, () => {
                    if (workspace.hasPreview.value) button.child = Box();
                    else {
                        button.child = content;
                        content.visible = true;
                    }
                    button.toggleClassName("overview-tasks-window-visible", !workspace.hasPreview.value);
                });

                // Drag stuff
                button.drag_source_set(Gdk.ModifierType.BUTTON1_MASK, TARGET, Gdk.DragAction.MOVE);
                button.drag_source_set_icon_name(substitute(c));
                // button.drag_source_set_icon_gicon(icon);

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
            },
        });
    };

    const Workspace = index => {
        const fixed = Box({
            attribute: {
                put: (widget, x, y) => {
                    if (!widget.attribute) return;
                    widget.css = calcCss(x, y, widget.attribute.w, widget.attribute.h);
                    fixed.pack_start(widget, false, false, 0);
                },
                move: (widget, x, y) => {
                    if (!widget?.attribute) return;
                    widget.css = calcCss(x, y, widget.attribute.w, widget.attribute.h);
                },
            },
        });
        const WorkspaceNumber = ({ index, ...rest }) =>
            Label({
                className: "overview-tasks-workspace-number",
                label: String(index),
                css: `
                    margin: ${Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * OVERVIEW_SCALE * OVERVIEW_WS_NUM_MARGIN_SCALE}px;
                    font-size: ${SCREEN_HEIGHT * OVERVIEW_SCALE * OVERVIEW_WS_NUM_SCALE}px;
                `,
                // Update when going to new ws group
                setup: self => self.hook(Hyprland.active.workspace, self => (self.label = `${getOffset() + index}`)),
                ...rest,
            });
        const widget = Box({
            className: "overview-tasks-workspace",
            vpack: "center",
            css: `min-width: ${SCREEN_WIDTH * OVERVIEW_SCALE}px; min-height: ${SCREEN_HEIGHT * OVERVIEW_SCALE}px;`,
            child: EventBox({
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
                    child: Image({
                        attribute: {},
                        setup: self => {
                            let prevOff, fileMon;
                            self.hook(Hyprland.active.workspace, () => {
                                const off = getOffset();
                                if (prevOff !== off) {
                                    prevOff = off;
                                    const realWsId = off + index;
                                    const wsPreviewImg = `${CACHE_DIR}/overview/${realWsId}.png`;
                                    const updatePreview = () =>
                                        // Timeout cause screenshot still writing to file or something
                                        Utils.timeout(5, () => {
                                            if (fileExists(wsPreviewImg)) {
                                                widget.hasPreview.value = true;
                                                const preview = GdkPixbuf.Pixbuf.new_from_file_at_size(
                                                    wsPreviewImg,
                                                    SCREEN_WIDTH * OVERVIEW_SCALE,
                                                    SCREEN_HEIGHT * OVERVIEW_SCALE
                                                );
                                                self.set_from_pixbuf(preview);
                                            } else {
                                                widget.hasPreview.value = false;
                                                self.clear();
                                            }
                                        });
                                    updatePreview();

                                    fileMon?.cancel();
                                    fileMon = Utils.monitorFile(wsPreviewImg, updatePreview);
                                }
                            });
                            self.connect("destroy", () => fileMon?.cancel());
                        },
                    }),
                    overlays: [fixed, WorkspaceNumber({ index: index, hpack: "start", vpack: "start" })],
                }),
            }),
        });
        widget.hasPreview = Variable(false);
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
                    client = null;
                    clientMap.delete(address);
                }
            });
        };
        widget.set = (clientJson, screenCoords) => {
            let c = clientMap.get(clientJson.address);
            if (c) {
                if (c.attribute?.ws !== clientJson.workspace.id) {
                    c.destroy();
                    c = null;
                    clientMap.delete(clientJson.address);
                } else if (c) {
                    c.attribute.w = clientJson.size[0];
                    c.attribute.h = clientJson.size[1];
                    c.attribute.updateIconSize(c);
                    fixed.attribute.move(c, Math.max(0, clientJson.at[0]), Math.max(0, clientJson.at[1]));
                    return;
                }
            }
            const newWindow = Window(clientJson, screenCoords, widget);
            if (newWindow === null) return;
            fixed.attribute.put(newWindow, Math.max(0, newWindow.attribute.x), Math.max(0, newWindow.attribute.y));
            clientMap.set(clientJson.address, newWindow);
        };
        widget.unset = clientAddress => {
            let c = clientMap.get(clientAddress);
            if (!c) return;
            c.destroy();
            c = null;
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
                            const client = Hyprland.getClient(clientAddress);
                            if (!client) return;

                            const id = client.workspace.id;
                            box.attribute.updateWorkspace(box, id);
                            box.get_children()[id - (getOffset() + startWorkspace)]?.unset(clientAddress);
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
                    });
            },
        });

    const SpecialWorkspace = (name, id) => {
        const wsPreviewImg = `${CACHE_DIR}/overview/${id}.png`;
        if (fileExists(wsPreviewImg)) execAsync(`rm ${wsPreviewImg}`).catch(print);
        const fixed = Box({
            attribute: {
                put: (widget, x, y) => {
                    if (!widget.attribute) return;
                    widget.css = calcCss(x, y, widget.attribute.w, widget.attribute.h);
                    fixed.pack_start(widget, false, false, 0);
                },
                move: (widget, x, y) => {
                    if (!widget?.attribute) return;
                    widget.css = calcCss(x, y, widget.attribute.w, widget.attribute.h);
                },
            },
        });
        const WorkspaceName = ({ name, ...rest }) =>
            Label({
                className: "overview-tasks-workspace-number",
                label: name.replace("special:", ""),
                css: `
                    margin: ${Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * OVERVIEW_SCALE * OVERVIEW_WS_NUM_MARGIN_SCALE}px;
                    font-size: ${SCREEN_HEIGHT * OVERVIEW_SCALE * OVERVIEW_WS_NUM_SCALE}px;
                `,
                ...rest,
            });
        const widget = Box({
            className: "overview-tasks-workspace",
            vpack: "center",
            css: `
                min-width: ${SCREEN_WIDTH * OVERVIEW_SCALE}px;
                min-height: ${SCREEN_HEIGHT * OVERVIEW_SCALE}px;
            `,
            attribute: { name },
            child: EventBox({
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
                    child: Image({
                        setup: self => {
                            const updatePreview = () =>
                                // Timeout cause screenshot still writing to file or something
                                Utils.timeout(5, () => {
                                    if (fileExists(wsPreviewImg)) {
                                        widget.hasPreview.value = true;
                                        const preview = GdkPixbuf.Pixbuf.new_from_file_at_size(
                                            wsPreviewImg,
                                            SCREEN_WIDTH * OVERVIEW_SCALE,
                                            SCREEN_HEIGHT * OVERVIEW_SCALE
                                        );
                                        self.set_from_pixbuf(preview);
                                    } else {
                                        widget.hasPreview.value = false;
                                        self.clear();
                                    }
                                });
                            updatePreview();

                            const fileMon = Utils.monitorFile(wsPreviewImg, updatePreview);
                            self.connect("destroy", () => fileMon.cancel());
                        },
                    }),
                    overlays: [fixed, WorkspaceName({ name: name, hpack: "start", vpack: "start" })],
                }),
            }),
        });
        widget.hasPreview = Variable(false);
        widget.clear = () => {
            clientMap.forEach((client, address) => {
                if (!client) return;
                if (client.attribute.wsName === name) {
                    client.destroy();
                    client = null;
                    clientMap.delete(address);
                }
            });
        };
        widget.set = (clientJson, screenCoords) => {
            let c = clientMap.get(clientJson.address);
            if (c) {
                if (c.attribute?.wsName !== clientJson.workspace.name) {
                    c.destroy();
                    c = null;
                    clientMap.delete(clientJson.address);
                } else if (c) {
                    c.attribute.w = clientJson.size[0];
                    c.attribute.h = clientJson.size[1];
                    c.attribute.updateIconSize(c);
                    fixed.attribute.move(c, Math.max(0, clientJson.at[0]), Math.max(0, clientJson.at[1]));
                    return;
                }
            }
            const newWindow = Window(clientJson, screenCoords, widget, () =>
                dispatchAndClose(`togglespecialworkspace ${name.replace("special:", "")}`)
            );
            if (newWindow === null) return;
            fixed.attribute.put(newWindow, Math.max(0, newWindow.attribute.x), Math.max(0, newWindow.attribute.y));
            clientMap.set(clientJson.address, newWindow);
        };
        widget.unset = clientAddress => {
            let c = clientMap.get(clientAddress);
            if (!c) return;
            c.destroy();
            c = null;
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
                            const client = Hyprland.getClient(clientAddress);
                            if (!client) return;

                            box.attribute.updateWorkspace(box, client.workspace.name);
                            box.get_children()[specialWorkspaces[row].get(client.workspace.name)]?.unset(clientAddress);
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
                    );
            },
        });

    const SpecialWorkspaces = () =>
        Box({
            vertical: true,
            className: "overview-tasks",
            setup: self => {
                const addWs = ({ id, name } = {}) => {
                    if (name?.startsWith("special:")) {
                        if (!specialWorkspaces.length || specialWorkspaces.at(-1).size >= WS_COLS)
                            self.add(SpecialWorkspaceRow(specialWorkspaces.length, SpecialWorkspace(name, id)));
                        else {
                            const child = self.get_children().at(-1);
                            child.attribute.addWorkspace(child, SpecialWorkspace(name, id));
                        }
                    }
                };
                JSON.parse(Hyprland.message("j/workspaces")).forEach(addWs);
                self.hook(
                    Hyprland,
                    (_, name) => addWs(JSON.parse(Hyprland.message("j/workspaces")).find(ws => ws.name === name)),
                    "workspace-added"
                );
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
