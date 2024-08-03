import Gdk from "gi://Gdk";
import Gtk from "gi://Gtk";
const { Box, EventBox, Button, Label, Revealer } = Widget;
const Notifications = await Service.import("notifications");
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import { setupCursorHover } from "../../.widgetutils/cursorhover.js";

export default (category, categoriesOpen) => {
    let destroying = false;
    const safeTimeout = (delay, callback) =>
        setTimeout(() => {
            if (!destroying) callback();
        }, delay);
    const destroy = () => {
        // Close animation (slide up)
        wholeThing.revealChild = false;
        Utils.timeout(120, () => wholeThing.destroy());
    };
    const destroyNoSlide = (delay = 30) => {
        if (destroying) return;
        destroying = true;

        // Delete ref to this
        delete categoriesOpen[category];

        const children = notifs.child.children;
        if (notifs.revealChild && children.length > 0) {
            // Destroy when final child is destroyed
            children.at(-1).connect("destroy", destroy);
            for (let i = 0; i < children.length; i++) Utils.timeout(delay * i, children[i].attribute.destroyWithAnims);
        } else {
            // Don't play animation if no children or not revealed
            for (const ch of children) ch.attribute.destroyImmediately();
            destroy();
        }
    };
    const destroyWithAnims = () => {
        if (destroying) return;

        widget.sensitive = false;
        categoryBox.setCss(middleClickClose);

        // If children revealed, small delay otherwise wait for slide anim to finish
        Utils.timeout(notifs.revealChild && notifs.child.children.length > 0 ? 30 : 200, destroyNoSlide);
    };
    const setCss = css => {
        categoryBox.setCss(css);
        notifs.child.setCss(css);
    };
    const notifs = Revealer({
        revealChild: true,
        transition: "slide_down",
        transitionDuration: 200,
        child: Box({
            vertical: true,
            className: "spacing-v-5-revealer",
        }),
    });
    const expandButton = Button({
        vpack: "center",
        className: "notif-cat-expand-btn",
        onClicked: self => {
            if (notifs.revealChild) {
                // Expanding...
                notifs.revealChild = false;
                self.child.label = "expand_more";
                expanded = false; // For gesture stuff
            } else {
                notifs.revealChild = true;
                self.child.label = "expand_less";
                expanded = true; // For gesture stuff
            }
        },
        child: MaterialIcon("expand_less", "norm", { vpack: "center" }),
        setup: setupCursorHover,
    });
    const header = Box({
        vpack: "center",
        className: "notif-category txt spacing-h-5",
        children: [
            Label({
                hexpand: true,
                xalign: 0,
                className: "txt-title-small margin-left-10",
                // ^ (extra margin on the left so that it looks similarly spaced
                // when compared to borderless "Clear" button on the right)
                label: category,
                setup: self => {
                    const callback = delay =>
                        safeTimeout(delay, () => (self.label = `${category} - ${notifs.child.children.length}`));
                    self.hook(Notifications, () => callback(10), "notified").hook(
                        Notifications,
                        () => callback(250),
                        "closed"
                    );
                },
            }),
            Button({
                className: "notif-listaction-btn",
                onClicked: destroyWithAnims,
                child: Box({
                    className: "spacing-h-5",
                    children: [
                        MaterialIcon("clear_all", "norm"),
                        Label({
                            className: "txt-small",
                            label: "Clear",
                        }),
                    ],
                }),
                setup: setupCursorHover,
            }),
            expandButton,
        ],
    });
    const widget = EventBox({
        onHover: self => {
            self.window.set_cursor(Gdk.Cursor.new_from_name(display, "grab"));
            if (!wholeThing.attribute.hovered) wholeThing.attribute.hovered = true;
        },
        onHoverLost: self => {
            self.window.set_cursor(null);
            if (wholeThing.attribute.hovered) wholeThing.attribute.hovered = false;
        },
        // onMiddleClick: destroyWithAnims, // I probably don't want this cause accidental clearing is annoying
        setup: self => {
            self.on("button-press-event", () => {
                wholeThing.attribute.held = true;
                header.toggleClassName("notif-category-clicked", true);
            }).on("button-release-event", () => {
                wholeThing.attribute.held = false;
                header.toggleClassName("notif-category-clicked", false);
            });
        },
    });
    const wholeThing = Revealer({
        attribute: {
            close: undefined,
            destroyWithAnims,
            dragging: false,
            held: false,
            hovered: false,
            notifs,
        },
        revealChild: false,
        transition: "slide_down",
        transitionDuration: 120,
        child: Box({
            // Box to make sure css-based spacing works
            vertical: true,
        }),
        setup: self =>
            self.hook(
                Notifications,
                () =>
                    safeTimeout(250, () => {
                        if (notifs.child.children.length === 0) destroyWithAnims();
                    }),
                "closed"
            ),
    });
    const display = Gdk.Display.get_default();

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
    const leftAnim1 = `transition: 200ms cubic-bezier(0.05, 0.7, 0.1, 1);
                       margin-left: -${animMargin}rem; margin-right: ${animMargin}rem;
                       opacity: 0;`;

    const rightAnim1 = `transition: 200ms cubic-bezier(0.05, 0.7, 0.1, 1);
                        margin-left: ${animMargin}rem; margin-right: -${animMargin}rem;
                        opacity: 0;`;

    const middleClickClose = `transition: 200ms cubic-bezier(0.85, 0, 0.15, 1);
                              margin-left: ${animMargin}rem; margin-right: -${animMargin}rem;
                              opacity: 0;`;

    const categoryBox = Box({
        attribute: { ready: false },
        homogeneous: true,
        children: [header],
        setup: self =>
            self
                .hook(
                    gesture,
                    () => {
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
                            if (initDirX < 0) setCss("margin-left: 0px; margin-right: 0px;");
                            else {
                                const margin = Number(offset_x + startMargin - MOVE_THRESHOLD);
                                setCss(`margin-left: ${margin}px; margin-right: -${margin}px;`);
                            }
                        } else if (initDirVertical == 0 && offset_x < -MOVE_THRESHOLD) {
                            if (initDirX > 0) setCss("margin-left: 0px; margin-right: 0px;");
                            else {
                                offset_x = Math.abs(offset_x);
                                const margin = Number(offset_x + startMargin - MOVE_THRESHOLD);
                                setCss(`margin-right: ${margin}px; margin-left: -${margin}px;`);
                            }
                        }
                        // Update dragging
                        wholeThing.attribute.dragging = Math.abs(offset_x) > MOVE_THRESHOLD;
                        if (Math.abs(offset_x) > MOVE_THRESHOLD || Math.abs(offset_y) > MOVE_THRESHOLD)
                            wholeThing.attribute.held = false;
                        widget.window?.set_cursor(Gdk.Cursor.new_from_name(display, "grabbing"));
                        // Vertical drag
                        if (initDirVertical == 1 && offset_y > MOVE_THRESHOLD && !expanded) {
                            notifs.revealChild = true;
                            expanded = true;
                            expandButton.child.label = "expand_less";
                        } else if (initDirVertical == 1 && offset_y < -MOVE_THRESHOLD && expanded) {
                            notifs.revealChild = false;
                            expanded = false;
                            expandButton.child.label = "expand_more";
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
                                setCss(rightAnim1);
                                widget.sensitive = false;
                            } else {
                                setCss(leftAnim1);
                                widget.sensitive = false;
                            }
                            safeTimeout(200, () => destroyNoSlide(0));
                        } else {
                            setCss(`transition: margin 200ms cubic-bezier(0.05, 0.7, 0.1, 1), opacity 200ms cubic-bezier(0.05, 0.7, 0.1, 1);
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
    widget.add(categoryBox);
    wholeThing.child.pack_start(widget, false, false, 5);
    wholeThing.child.pack_start(notifs, false, false, 0);
    return wholeThing;
};
