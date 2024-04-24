const { Gdk, Gtk } = imports.gi;
const { Box, Label, Button, Icon, Menu, MenuItem, Revealer, EventBox, Overlay } = Widget;
const Hyprland = await Service.import("hyprland");
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../../variables.js";
import { setupCursorHoverGrab } from "../.widgetutils/cursorhover.js";
import { dumpToWorkspace, swapWorkspace } from "./actions.js";
import { substitute } from "../.miscutils/icons.js";
import { DoubleRevealer } from "../.widgethacks/advancedrevealers.js";
import { range } from "../.miscutils/system.js";

const NUM_WORKSPACE_ROWS = 2;
const NUM_WORKSPACE_COLS = 5;
const NUM_WORKSPACES_SHOWN = NUM_WORKSPACE_COLS * NUM_WORKSPACE_ROWS;
const OVERVIEW_SCALE = 0.18;
const OVERVIEW_WS_NUM_SCALE = 0.09;
const OVERVIEW_WS_NUM_MARGIN_SCALE = 0.07;
const TARGET = [Gtk.TargetEntry.new("text/plain", Gtk.TargetFlags.SAME_APP, 0)];

// Used for triggering overview update
const overviewTick = Variable(true);
const updateOverview = (force = false) => {
    if (force || App.getWindow("overview").visible) overviewTick.setValue(true);
};

const dispatch = dispatcher => Hyprland.messageAsync(`dispatch ${dispatcher}`).catch(print);
const dispatchAndClose = dispatcher => {
    App.closeWindow("overview");
    dispatch(dispatcher);
};

const getWsGroup = ws => Math.floor(((ws || Hyprland.active.workspace.id) - 1) / NUM_WORKSPACES_SHOWN);
const getWsGroupStart = ws => getWsGroup(ws) * NUM_WORKSPACES_SHOWN + 1;
const toAbsWs = id => getWsGroupStart() + id - 1;

const ContextMenuWorkspaceArray = ({ label, actionFunc, thisWorkspace }) =>
    MenuItem({
        label: label,
        setup: self => {
            const submenu = Menu({ className: "menu" });

            const startWorkspace = getWsGroupStart();
            const endWorkspace = startWorkspace + NUM_WORKSPACES_SHOWN;
            for (let i = startWorkspace; i < endWorkspace; i++) {
                if (i === thisWorkspace) continue;
                const button = MenuItem({ label: `Workspace ${i}` });
                button.connect("activate", () => {
                    actionFunc(thisWorkspace, i);
                    updateOverview();
                });
                submenu.append(button);
            }
            self.set_reserve_indicator(true);
            self.set_submenu(submenu);
        },
    });

const Window = ({ address, at: [x, y], size: [w, h], workspace: { id }, class: cls, title, xwayland }) => {
    if (w <= 0 || h <= 0 || (cls === "" && title === "")) return null;

    const revealInfo = Math.min(w, h) * OVERVIEW_SCALE > 70;

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

    const appIcon = Icon({
        icon: substitute(cls),
        size: (Math.min(w, h) * OVERVIEW_SCALE) / 2.5,
    });
    return Button({
        attribute: {
            address,
            x,
            y,
            w,
            h,
            ws: id,
        },
        className: "overview-tasks-window",
        hpack: "start",
        vpack: "start",
        css: `
            margin-left: ${Math.round(x * OVERVIEW_SCALE)}px;
            margin-top: ${Math.round(y * OVERVIEW_SCALE)}px;
            min-width: ${Math.round(w * OVERVIEW_SCALE)}px;
            min-height: ${Math.round(h * OVERVIEW_SCALE)}px;
        `,
        onClicked: () => dispatchAndClose(`focuswindow address:${address}`),
        onMiddleClickRelease: () => dispatch(`closewindow address:${address}`),
        onSecondaryClick: button => {
            button.toggleClassName("overview-tasks-window-selected", true);
            const menu = Menu({
                className: "menu",
                children: [
                    MenuItem({
                        child: Label({ xalign: 0, label: "Close (Middle-click)" }),
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
        child: Box({
            vertical: true,
            vpack: "center",
            children: [
                appIcon,
                DoubleRevealer({
                    transition1: "slide_right",
                    transition2: "slide_down",
                    revealChild: revealInfo,
                    child: Label({
                        maxWidthChars: 10, // Doesn't matter what number
                        truncate: "end",
                        className: `margin-top-5 txt ${xwayland ? "txt-italic" : ""}`,
                        css: `
                            font-size: ${(Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * OVERVIEW_SCALE) / 14.6}px;
                            margin: 0px ${(Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * OVERVIEW_SCALE) / 10}px;
                        `,
                        // If the title is too short, include the class
                        label: title.length <= 3 ? `${cls}: ${title}` : title,
                    }),
                }),
            ],
        }),
        tooltipText: `${cls}: ${title}`,
        setup: button => {
            setupCursorHoverGrab(button);

            button.drag_source_set(Gdk.ModifierType.BUTTON1_MASK, TARGET, Gdk.DragAction.MOVE);
            button.drag_source_set_icon_name(substitute(cls));
            // button.drag_source_set_icon_gicon(icon);

            // On drag start, add the dragging class
            button.connect("drag-begin", button => button.toggleClassName("overview-tasks-window-dragging", true));
            // On drag finish, give address
            button.connect("drag-data-get", (_w, _c, data) => {
                data.set_text(address, address.length);
                button.toggleClassName("overview-tasks-window-dragging", false);
            });
        },
    });
};

const WorkspaceNumber = ({ id, ...rest }) =>
    Label({
        className: "overview-tasks-workspace-number",
        css: `
            margin: ${Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * OVERVIEW_SCALE * OVERVIEW_WS_NUM_MARGIN_SCALE}px;
            font-size: ${SCREEN_HEIGHT * OVERVIEW_SCALE * OVERVIEW_WS_NUM_SCALE}px;
        `,
        // Update when going to new ws group
        setup: self => self.hook(Hyprland.active.workspace, self => (self.label = String(toAbsWs(id)))),
        ...rest,
    });

export default () => {
    const windows = new Map();

    const addWindow = address => {
        const window = Window(Hyprland.getClient(address));
        if (window) windows.set(address, window);
    };
    const removeWindow = address => {
        windows.get(address).destroy();
        windows.delete(address);
    };
    const updateWindow = address => {
        removeWindow(address);
        addWindow(address);
    };

    Hyprland.clients.forEach(({ address }) => addWindow(address));

    Hyprland.connect("client-added", (_, address) => {
        addWindow(address);
        updateOverview();
    });
    Hyprland.connect("client-removed", (_, address) => {
        removeWindow(address);
        updateOverview();
    });
    App.connect("window-toggled", (_, windowName, visible) => {
        if (windowName === "overview" && visible) updateOverview(true);
    });

    let prevWsGroup = getWsGroup(Hyprland.active.workspace.id);
    Hyprland.active.workspace.connect("changed", (_, ws) => {
        const newWsGroup = getWsGroup(ws);
        if (prevWsGroup !== newWsGroup) {
            prevWsGroup = newWsGroup;
            updateOverview();
        }
    }); // idk whether this is called

    const Workspace = id => {
        const overlay = Overlay({
            child: Box({
                className: "overview-tasks-workspace",
                css: `
                    min-width: ${SCREEN_WIDTH * OVERVIEW_SCALE}px;
                    min-height: ${SCREEN_HEIGHT * OVERVIEW_SCALE}px;
                `,
            }),
            overlays: [WorkspaceNumber({ id, hpack: "start", vpack: "start" })],
        });
        return EventBox({
            child: overlay,
            onPrimaryClick: () => dispatchAndClose(`workspace ${toAbsWs(id)}`),
            setup: eventbox => {
                eventbox.drag_dest_set(Gtk.DestDefaults.ALL, TARGET, Gdk.DragAction.COPY);
                eventbox.connect("drag-data-received", (_w, _c, _x, _y, data) => {
                    const address = data.get_text();
                    dispatch(`movetoworkspacesilent ${toAbsWs(id)},address:${address}`);
                    updateWindow(address);
                    updateOverview();
                });
            },
            attribute: {
                update: () => {
                    windows.forEach(window => {
                        const { x, y, w, h, ws } = window.attribute;
                        if (overlay.overlays.includes(window) || ws !== toAbsWs(id)) return;
                        window.css = `
                            margin-left: ${Math.round(x * OVERVIEW_SCALE)}px;
                            margin-top: ${Math.round(y * OVERVIEW_SCALE)}px;
                            min-width: ${Math.round(w * OVERVIEW_SCALE)}px;
                            min-height: ${Math.round(h * OVERVIEW_SCALE)}px;
                        `;
                        overlay.add_overlay(window);
                    });
                    overlay.show_all();
                },
            },
        });
    };

    const WorkspaceRow = row =>
        Box({
            children: range(NUM_WORKSPACE_COLS, NUM_WORKSPACE_COLS * row + 1).map(Workspace),
            attribute: {
                range: { start: NUM_WORKSPACE_COLS * row + 1, end: NUM_WORKSPACE_COLS * (row + 1) },
                update: self => self.get_children().forEach(ws => ws.attribute.update()),
            },
            setup: self => self.hook(overviewTick, () => self.attribute.update(self)),
        });

    return Revealer({
        revealChild: true,
        transition: "slide_down",
        transitionDuration: 200,
        child: Box({
            vertical: true,
            className: "overview-tasks",
            children: range(2, 0).map(WorkspaceRow),
        }),
    });
};
