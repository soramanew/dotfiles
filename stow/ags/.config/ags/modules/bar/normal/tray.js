import Gdk from "gi://Gdk";
import AstalTray from "gi://AstalTray";
import { Binding } from "resource:///com/github/Aylur/ags/service.js";
const { Box, Icon, Button } = Widget;
export const SystemTray = AstalTray.Tray.get_default();

const SysTrayItem = item =>
    Button({
        className: "bar-systray-item",
        attribute: item.create_menu(),
        child: Icon({
            icon: Utils.watch(
                item.icon_pixbuf || item.icon_name || "image-missing",
                item,
                () => item.icon_pixbuf || item.icon_name || "image-missing"
            ),
        }),
        tooltipMarkup: new Binding(item, "tooltip_markup"),
        onPrimaryClick: () => item.activate(0, 0),
        onSecondaryClick: self => self.attribute?.popup_at_widget(self, Gdk.Gravity.SOUTH, Gdk.Gravity.NORTH, null),
    });

export default (props = {}) =>
    Box({
        ...props,
        className: "margin-right-5 spacing-h-15",
        attribute: {
            items: new Map(),
            onAdded: (self, id) => {
                if (!id) return;
                const item = SystemTray.get_item(id);
                if (self.attribute.items.has(id) || !item) return;
                const widget = SysTrayItem(item);
                self.attribute.items.set(id, widget);
                self.pack_start(widget, false, false, 0);
                self.show_all();
            },
            onRemoved: (self, id) => {
                if (!self.attribute.items.has(id)) return;
                self.attribute.items.get(id).destroy();
                self.attribute.items.delete(id);
            },
        },
        setup: self => {
            SystemTray.get_items().forEach(item => self.attribute.onAdded(self, item.item_id));
            self.hook(SystemTray, (self, id) => self.attribute.onAdded(self, id), "item_added");
            self.hook(SystemTray, (self, id) => self.attribute.onRemoved(self, id), "item_removed");
        },
    });
