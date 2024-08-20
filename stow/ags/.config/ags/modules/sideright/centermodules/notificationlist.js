// This file is for the notification list on the sidebar
// For the popup notifications, see onscreendisplay.js
// The actual widget for each single notification is in ags/modules/.commonwidgets/notification.js
const { Box, Button, Label, Revealer, Stack } = Widget;
const Notifications = await Service.import("notifications");
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import { setupCursorHover } from "../../.widgetutils/cursorhover.js";
import Notification, { notifCategories } from "../../.commonwidgets/notification.js";
import NotifCategory from "./notification_category.js";
import GradientScrollable from "../../.commonwidgets/gradientscrollable.js";

export default props => {
    const notifEmptyContent = Box({
        homogeneous: true,
        children: [
            Box({
                vertical: true,
                vpack: "center",
                className: "txt-subtext spacing-v-10",
                children: [
                    Box({
                        vertical: true,
                        className: "spacing-v-5",
                        children: [
                            MaterialIcon("notifications_active", "gigantic"),
                            Label({ label: "No notifications", className: "txt-small" }),
                        ],
                    }),
                ],
            }),
        ],
    });
    const allNotifs = [];
    const categoriesOpen = {};
    const notificationList = Box({
        vertical: true,
        vpack: "start",
        className: "spacing-v-5-revealer",
        setup: self =>
            self
                .hook(
                    Notifications,
                    (box, id) => {
                        const getCategory = notifCat => {
                            if (!categoriesOpen.hasOwnProperty(notifCat)) {
                                const category = NotifCategory(notifCat, categoriesOpen);
                                categoriesOpen[notifCat] = category;
                                box.pack_end(category, false, false, 0);
                                box.children = box.children.sort(
                                    (a, b) =>
                                        notifCategories.indexOf(a.attribute.name) -
                                        notifCategories.indexOf(b.attribute.name)
                                );
                                box.show_all();
                            }
                            return categoriesOpen[notifCat];
                        };
                        const addNotif = (notif, replace = true) => {
                            notif = Notification({ notifObject: notif, isPopup: false, getCategory });
                            if (!notif) return;

                            const notifTime = notif.attribute.timeCategory;
                            getCategory(notifTime);

                            const matchingNotifIdx = allNotifs.findIndex(
                                n => n.notif.attribute.id === notif.attribute.id
                            );
                            if (matchingNotifIdx !== -1 && replace) {
                                const catNotifs =
                                    categoriesOpen[allNotifs[matchingNotifIdx].category].attribute.notifs.child;
                                allNotifs.splice(matchingNotifIdx, 1);
                                const idx = catNotifs.children.findIndex(n => n.attribute.id === notif.attribute.id);
                                catNotifs.children[idx].attribute.destroyImmediately(false);
                                notif.attribute.instantReady();
                                catNotifs.packEndSig(notif, false, false, 0);
                                catNotifs.reorder_child(notif, catNotifs.children.length - idx - 1);
                                catNotifs.show_all();
                            } else {
                                const catNotifsRevealer = categoriesOpen[notifTime].attribute.notifs;
                                const catNotifs = catNotifsRevealer.child;
                                catNotifs.packEndSig(notif, false, false, 0);
                                catNotifs.show_all();
                                catNotifsRevealer.revealChild = true;
                            }
                            allNotifs.push({ notif, category: notifTime });
                        };

                        if (allNotifs.length == 0) {
                            // On init there's no notif, or 1st notif
                            Notifications.notifications.forEach(n => addNotif(n, false));
                            return;
                        }
                        // 2nd or later notif
                        addNotif(Notifications.getNotification(id));
                    },
                    "notified"
                )
                .hook(
                    Notifications,
                    (_, id) => {
                        if (!id) return;
                        for (let i = allNotifs.length - 1; i >= 0; i--) {
                            if (allNotifs[i].notif.attribute.id === id) {
                                allNotifs[i].notif.attribute.destroyWithAnims();
                                allNotifs.splice(i, 1); // Remove from from array when destroyed
                            }
                        }
                    },
                    "closed"
                ),
    });
    const ListActionButton = (icon, name, action) =>
        Button({
            className: "notif-listaction-btn",
            onClicked: action,
            child: Box({
                className: "spacing-h-5",
                children: [
                    MaterialIcon(icon, "norm"),
                    Label({
                        className: "txt-small",
                        label: name,
                    }),
                ],
            }),
            setup: setupCursorHover,
        });
    const silenceButton = ListActionButton("notifications_paused", "Silence", self => {
        Notifications.dnd = !Notifications.dnd;
        self.toggleClassName("notif-listaction-btn-enabled", Notifications.dnd);
    });
    const clearButton = Revealer({
        transition: "slide_right",
        transitionDuration: 120,
        revealChild: Notifications.bind("notifications").as(n => n.length > 0),
        child: ListActionButton("clear_all", "Clear", () => {
            let delay = 0;
            for (const ch of notificationList.children) {
                Utils.timeout(delay, ch.attribute.destroyWithAnims, ch);
                const notifs = ch.attribute.notifs;
                delay +=
                    notifs.revealChild && notifs.child.children.length > 0
                        ? 50 * (notifs.child.children.length - 1) + 100
                        : 100;
            }
        }),
    });
    const notifCount = Revealer({
        transition: "slide_left",
        transitionDuration: 120,
        revealChild: Notifications.bind("notifications").as(n => n.length > 0),
        child: Label({
            xalign: 0,
            className: "txt-small margin-left-10",
            label: Notifications.bind("notifications").as(n => `${n.length} notification${n.length === 1 ? "" : "s"}`),
        }),
    });
    const listTitle = Box({
        vpack: "start",
        className: "txt spacing-h-5",
        children: [notifCount, Box({ hexpand: true }), silenceButton, clearButton],
    });
    const notifList = GradientScrollable({
        hexpand: true,
        layer: 1,
        child: Box({ vexpand: true, child: notificationList }),
    });
    const listContents = Stack({
        transition: "crossfade",
        transitionDuration: 180,
        children: {
            empty: notifEmptyContent,
            list: notifList,
        },
        shown: Notifications.bind("notifications").as(n => (n.length > 0 ? "list" : "empty")),
    });
    return Box({
        ...props,
        className: "spacing-v-5",
        vertical: true,
        children: [listContents, listTitle],
    });
};
