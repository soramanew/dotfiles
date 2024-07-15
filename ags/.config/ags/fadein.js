import Gdk from "gi://Gdk";
import { forMonitors } from "./modules/.miscutils/system.js";

const display = Gdk.Display.get_default();

App.config({
    stackTraceOnError: true,
    windows: forMonitors(id =>
        Widget.Window({
            monitor: id,
            name: `fadein${id}`,
            anchor: ["top", "left", "bottom", "right"],
            exclusivity: "ignore",
            keymode: "exclusive",
            layer: "overlay",
            child: Widget.Box({
                css: "background-color: #000000;",
                setup: () => Utils.timeout(2000, () => App.quit()),
            }),
            // Needs timeout for some reason if not window is null
            setup: self =>
                Utils.timeout(1, () => self.get_window().set_cursor(Gdk.Cursor.new_from_name(display, "none"))),
        })
    ),
});
