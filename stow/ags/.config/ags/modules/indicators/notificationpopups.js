// This file is for popup notifications
const { Box } = Widget;
const Notifications = await Service.import("notifications");
import Notification from "../.commonwidgets/notification.js";

export default () =>
    Box({
        vertical: true,
        hpack: "center",
        className: "osd-notifs spacing-v-5-revealer",
        attribute: {
            map: new Map(),
            dismiss: (box, id, force = false) => {
                if (!id || !box.attribute.map.has(id)) return;
                const notifWidget = box.attribute.map.get(id);
                if (notifWidget == null || (notifWidget.attribute.hovered && !force)) return; // cuz already destroyed

                notifWidget.attribute.destroyNoSlide();
                box.attribute.map.delete(id);
            },
            notify: (box, id) => {
                if (!id || Notifications.dnd) return;
                if (!Notifications.getNotification(id)) return;

                const notif = Notifications.getNotification(id);
                const newNotif = Notification({
                    notifObject: notif,
                    isPopup: true,
                });

                if (box.attribute.map.has(id)) {
                    newNotif.attribute.instantReady();
                    box.attribute.map.get(id).destroy();
                }

                box.attribute.map.set(id, newNotif);
                box.pack_end(newNotif, false, false, 0);
                box.show_all();
            },
        },
        setup: self =>
            self
                .hook(Notifications, (box, id) => box.attribute.notify(box, id), "notified")
                .hook(Notifications, (box, id) => box.attribute.dismiss(box, id), "dismissed")
                .hook(Notifications, (box, id) => box.attribute.dismiss(box, id, true), "closed"),
    });
