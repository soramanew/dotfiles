// This file is for the actual widget for each single notification
import GLib from "gi://GLib";
import Gdk from "gi://Gdk";
import Gtk from "gi://Gtk";
const { Box, EventBox, Icon, Overlay, Label, Button, Revealer } = Widget;
import { MaterialIcon } from "./materialicon.js";
import { setupCursorHover } from "../.widgetutils/cursorhover.js";
import { AnimatedCircProg } from "./cairo_circularprogress.js";

function guessMessageType(summary) {
    const str = summary.toLowerCase();
    if (str.includes("reboot")) return "restart_alt";
    if (str.includes("recording")) return "screen_record";
    if (str.includes("battery") || str.startsWith("power")) return "power";
    if (str.includes("screenshot")) return "screenshot_monitor";
    if (str.includes("welcome")) return "waving_hand";
    if (str.includes("time")) return "scheduleb";
    if (str.includes("installed")) return "download";
    if (str.includes("update")) return "update";
    if (str.startsWith("file")) return "folder_copy";
    return "chat";
}

const NotificationIcon = notifObject => {
    // { appEntry, appIcon, image }, urgency = 'normal'
    if (notifObject.image) {
        return Box({
            valign: Gtk.Align.CENTER,
            hexpand: false,
            className: "notif-icon",
            css: `
                background-image: url("${notifObject.image}");
                background-size: auto 100%;
                background-repeat: no-repeat;
                background-position: center;
            `,
        });
    }

    let icon = "NO_ICON";
    if (Utils.lookUpIcon(notifObject.appIcon)) icon = notifObject.appIcon;
    else if (Utils.lookUpIcon(notifObject.appEntry)) icon = notifObject.appEntry;

    return Box({
        vpack: "center",
        hexpand: false,
        className: `notif-icon notif-icon-material-${notifObject.urgency}`,
        homogeneous: true,
        children: [
            icon !== "NO_ICON"
                ? Icon({ vpack: "center", icon })
                : MaterialIcon(
                      notifObject.urgency === "critical" ? "release_alert" : guessMessageType(notifObject.summary),
                      "hugerass",
                      { hexpand: true }
                  ),
        ],
    });
};

export default ({ notifObject, isPopup = false, ...rest }) => {
    if (!notifObject) return;
    const popupTimeout = notifObject.timeout || (notifObject.urgency == "critical" ? 8000 : 3000);
    let destroying = false;
    const destroyNoSlide = () => {
        if (destroying) return;
        destroying = true;

        if (isPopup) notifObject.dismiss();
        else notifObject.close();

        wholeThing.revealChild = false;
        Utils.timeout(120, () => wholeThing.destroy());
    };
    const destroyWithAnims = () => {
        if (destroying) return;

        widget.sensitive = false;
        notificationBox.setCss(middleClickClose);
        Utils.timeout(120, destroyNoSlide);
    };
    let stoppedTime = 1; // Range 0-1
    let heldStart;
    let timeHeld = 0;
    const widget = EventBox({
        onHover: self => {
            self.window.set_cursor(Gdk.Cursor.new_from_name(display, "grab"));
            if (!wholeThing.attribute.hovered) wholeThing.attribute.hovered = true;
        },
        onHoverLost: self => {
            self.window.set_cursor(null);
            if (wholeThing.attribute.hovered) wholeThing.attribute.hovered = false;
            // if (isPopup) destroyNoSlide();
        },
        onMiddleClick: destroyWithAnims,
        setup: self => {
            self.on("button-press-event", (_, event) => {
                if (event.get_button()[1] !== 1) return; // Only want primary click
                if (event.get_event_type() === 5) {
                    Utils.execAsync(["wl-copy", notifObject.body]).catch(print);
                    notifTextSummary.label = notifObject.summary + " (copied)";
                    Utils.timeout(3000, () => {
                        if (!destroying) notifTextSummary.label = notifObject.summary;
                    });
                    return;
                }
                wholeThing.attribute.held = true;
                notificationContent.toggleClassName(
                    `${isPopup ? "popup-" : ""}notif-clicked-${notifObject.urgency}`,
                    true
                );
                if (isPopup) {
                    timeout?.destroy();
                    timeout = null;
                    heldStart = Date.now();
                    stoppedTime = 1 - (heldStart - initialTime - timeHeld) / popupTimeout;
                    prog.attribute.stop(prog);
                }
            }).on("button-release-event", () => {
                wholeThing.attribute.held = false;
                notificationContent.toggleClassName(
                    `${isPopup ? "popup-" : ""}notif-clicked-${notifObject.urgency}`,
                    false
                );
                if (isPopup) {
                    timeout?.destroy();
                    timeout = setTimeout(destroyNoSlide, popupTimeout * stoppedTime);
                    prog.attribute.updateProgress(prog, 0, (popupTimeout - prog.attribute.initDelay) * stoppedTime);
                    if (heldStart) timeHeld += Date.now() - heldStart;
                }
            });
        },
    });
    const wholeThing = Revealer({
        attribute: {
            destroyNoSlide,
            destroyWithAnims,
            dragging: false,
            held: false,
            hovered: false,
            id: notifObject.id,
            instantReady: () => {
                const pre = wholeThing.transitionDuration;
                wholeThing.transitionDuration = 0;
                wholeThing.revealChild = true;
                wholeThing.transitionDuration = pre;
            },
        },
        revealChild: false,
        transition: "slide_down",
        transitionDuration: 120,
        child: Box({
            // Box to make sure css-based spacing works
            homogeneous: true,
        }),
    });

    const display = Gdk.Display.get_default();
    const notifTextPreview = Revealer({
        transition: "slide_down",
        transitionDuration: 120,
        revealChild: true,
        child: Label({
            xalign: 0,
            className: `txt-smallie notif-body-${notifObject.urgency}`,
            useMarkup: true,
            xalign: 0,
            justify: Gtk.Justification.LEFT,
            maxWidthChars: 24,
            truncate: "end",
            label: notifObject.body.split("\n")[0],
        }),
    });
    const notifTextExpanded = Revealer({
        transition: "slide_up",
        transitionDuration: 120,
        revealChild: false,
        child: Box({
            vertical: true,
            className: "spacing-v-10",
            children: [
                Label({
                    xalign: 0,
                    className: `txt-smallie notif-body-${notifObject.urgency}`,
                    useMarkup: true,
                    justify: Gtk.Justification.LEFT,
                    maxWidthChars: 24,
                    wrap: true,
                    label: notifObject.body,
                }),
                Box({
                    className: "notif-actions spacing-h-5",
                    children: [
                        Button({
                            hexpand: true,
                            className: `notif-action notif-action-${notifObject.urgency}`,
                            onClicked: destroyWithAnims,
                            setup: setupCursorHover,
                            child: Label({ label: "Close" }),
                        }),
                        ...notifObject.actions.map(action =>
                            Button({
                                hexpand: true,
                                className: `notif-action notif-action-${notifObject.urgency}`,
                                onClicked: () => notifObject.invoke(action.id),
                                setup: setupCursorHover,
                                child: Label({ label: action.label }),
                            })
                        ),
                    ],
                }),
            ],
        }),
    });
    const prog = isPopup
        ? AnimatedCircProg({
              className: `notif-circprog-${notifObject.urgency}`,
              vpack: "center",
              hpack: "center",
              initFrom: 100,
              initTo: 0,
              initAnimTime: popupTimeout,
          })
        : null;
    const notifIcon = Box({
        vpack: "start",
        children: [
            isPopup
                ? Overlay({
                      child: NotificationIcon(notifObject),
                      overlays: [prog],
                  })
                : NotificationIcon(notifObject),
        ],
    });
    let notifTime = "";
    const messageTime = GLib.DateTime.new_from_unix_local(notifObject.time);
    const todayDay = GLib.DateTime.new_now_local().get_day_of_year();
    if (messageTime.get_day_of_year() == todayDay) {
        notifTime = messageTime.format("%H:%M");
        wholeThing.attribute.timeCategory = "Today";
    } else if (messageTime.get_day_of_year() == todayDay - 1) {
        notifTime = "Yesterday";
        wholeThing.attribute.timeCategory = "Yesterday";
    } else {
        notifTime = messageTime.format("%d/%m");
        if (messageTime.get_day_of_year() >= todayDay - 7) wholeThing.attribute.timeCategory = "Last week";
        else wholeThing.attribute.timeCategory = "A long time ago";
    }
    const notifTextSummary = Label({
        xalign: 0,
        className: "txt-small txt-semibold titlefont",
        justify: Gtk.Justification.LEFT,
        hexpand: true,
        maxWidthChars: 24,
        truncate: "end",
        ellipsize: 3,
        useMarkup: true,
        label: notifObject.summary,
    });
    const notifTimeLabel = Label({
        vpack: "center",
        justification: "right",
        className: "txt-smaller txt-semibold",
        label: notifTime,
        tooltipText: notifObject.appName ? `Sender: ${notifObject.appName}` : "",
    });
    const notifAppName =
        notifObject.appName && notifObject.appName.length < 10
            ? Label({
                  vpack: "center",
                  justification: "right",
                  className: `txt-smallie notif-body-${notifObject.urgency}`,
                  label: ` - ${notifObject.appName}`,
              })
            : null;
    const notifText = Box({
        valign: Gtk.Align.CENTER,
        vertical: true,
        hexpand: true,
        children: [
            Box({
                className: "spacing-h-5",
                children: [notifTextSummary, notifAppName, notifTimeLabel],
            }),
            notifTextPreview,
            notifTextExpanded,
        ],
    });
    const notifExpandButton = Button({
        vpack: "start",
        className: "notif-expand-btn",
        onClicked: self => {
            if (notifTextPreview.revealChild) {
                // Expanding...
                notifTextPreview.revealChild = false;
                notifTextExpanded.revealChild = true;
                self.child.label = "expand_less";
                expanded = true;
            } else {
                notifTextPreview.revealChild = true;
                notifTextExpanded.revealChild = false;
                self.child.label = "expand_more";
                expanded = false;
            }
        },
        child: MaterialIcon("expand_more", "norm", { vpack: "center" }),
        setup: setupCursorHover,
    });
    const notificationContent = Box({
        ...rest,
        className: `${isPopup ? "popup-" : ""}notif-${notifObject.urgency} spacing-h-10`,
        children: [
            notifIcon,
            Box({
                className: "spacing-h-5",
                children: [notifText, notifExpandButton],
            }),
        ],
    });

    // Gesture stuff
    const gesture = Gtk.GestureDrag.new(widget);
    let initDirX = 0;
    let initDirVertical = -1; // -1: unset, 0: horizontal, 1: vertical
    let expanded = false;
    // in px
    const startMargin = 0;
    const MOVE_THRESHOLD = 10;
    const DRAG_CONFIRM_THRESHOLD = 100;
    // in rem
    const maxOffset = 10.227;
    const endMargin = 20.455;
    const animMargin = Number(maxOffset + endMargin);
    const leftAnim1 = `transition: 120ms cubic-bezier(0.05, 0.7, 0.1, 1);
                       margin-left: -${animMargin}rem;
                       margin-right: ${animMargin}rem;
                       opacity: 0;`;

    const rightAnim1 = `transition: 120ms cubic-bezier(0.05, 0.7, 0.1, 1);
                        margin-left:   ${animMargin}rem;
                        margin-right: -${animMargin}rem;
                        opacity: 0;`;

    const middleClickClose = `transition: 120ms cubic-bezier(0.85, 0, 0.15, 1);
                              margin-left:   ${animMargin}rem;
                              margin-right: -${animMargin}rem;
                              opacity: 0;`;

    const notificationBox = Box({
        attribute: { ready: false },
        homogeneous: true,
        children: [notificationContent],
        setup: self =>
            self
                .hook(
                    gesture,
                    self => {
                        let offset_x = gesture.get_offset()[1];
                        let offset_y = gesture.get_offset()[2];
                        // Which dir?
                        if (initDirVertical == -1) {
                            if (Math.abs(offset_y) > MOVE_THRESHOLD) initDirVertical = 1;
                            if (initDirX == 0 && Math.abs(offset_x) > MOVE_THRESHOLD) {
                                initDirVertical = 0;
                                initDirX = offset_x > 0 ? 1 : -1;
                            }
                        }
                        // Horizontal drag
                        if (initDirVertical == 0 && offset_x > MOVE_THRESHOLD) {
                            if (initDirX < 0) self.setCss(`margin-left: 0px; margin-right: 0px;`);
                            else {
                                const margin = Number(offset_x + startMargin - MOVE_THRESHOLD);
                                self.setCss(`margin-left: ${margin}px; margin-right: -${margin}px;`);
                            }
                        } else if (initDirVertical == 0 && offset_x < -MOVE_THRESHOLD) {
                            if (initDirX > 0) self.setCss(`margin-left: 0px; margin-right: 0px;`);
                            else {
                                offset_x = Math.abs(offset_x);
                                const margin = Number(offset_x + startMargin - MOVE_THRESHOLD);
                                self.setCss(`margin-right: ${margin}px; margin-left: -${margin}px;`);
                            }
                        }
                        // Update dragging
                        wholeThing.attribute.dragging = Math.abs(offset_x) > MOVE_THRESHOLD;
                        if (Math.abs(offset_x) > MOVE_THRESHOLD || Math.abs(offset_y) > MOVE_THRESHOLD)
                            wholeThing.attribute.held = false;
                        widget.window?.set_cursor(Gdk.Cursor.new_from_name(display, "grabbing"));
                        // Vertical drag
                        if (initDirVertical == 1 && offset_y > MOVE_THRESHOLD && !expanded) {
                            notifTextPreview.revealChild = false;
                            notifTextExpanded.revealChild = true;
                            expanded = true;
                            notifExpandButton.child.label = "expand_less";
                        } else if (initDirVertical == 1 && offset_y < -MOVE_THRESHOLD && expanded) {
                            notifTextPreview.revealChild = true;
                            notifTextExpanded.revealChild = false;
                            expanded = false;
                            notifExpandButton.child.label = "expand_more";
                        }
                    },
                    "drag-update"
                )
                .hook(
                    gesture,
                    self => {
                        if (!self.attribute.ready) {
                            wholeThing.revealChild = true;
                            self.attribute.ready = true;
                            return;
                        }
                        const offset_h = gesture.get_offset()[1];

                        if (Math.abs(offset_h) > DRAG_CONFIRM_THRESHOLD && offset_h * initDirX > 0) {
                            if (offset_h > 0) {
                                self.setCss(rightAnim1);
                                widget.sensitive = false;
                            } else {
                                self.setCss(leftAnim1);
                                widget.sensitive = false;
                            }
                            Utils.timeout(120, destroyNoSlide);
                        } else {
                            self.setCss(`transition: margin 200ms cubic-bezier(0.05, 0.7, 0.1, 1), opacity 200ms cubic-bezier(0.05, 0.7, 0.1, 1);
                                         margin-left: ${startMargin}px; margin-right: ${startMargin}px;
                                         margin-bottom: unset; margin-top: unset;
                                         opacity: 1;`);
                            if (widget.window) widget.window.set_cursor(Gdk.Cursor.new_from_name(display, "grab"));

                            wholeThing.attribute.dragging = false;
                        }
                        initDirX = 0;
                        initDirVertical = -1;
                    },
                    "drag-end"
                ),
    });
    widget.add(notificationBox);
    wholeThing.child.add(widget);
    const initialTime = Date.now();
    let timeout = isPopup ? setTimeout(destroyNoSlide, popupTimeout) : null;
    return wholeThing;
};
