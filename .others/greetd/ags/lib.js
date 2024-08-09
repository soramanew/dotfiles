import Gdk from "gi://Gdk";

const display = Gdk.Display.get_default();
const defaultCursor = Gdk.Cursor.new_from_name(display, "default");
export const setupCursorHover = button => {
    button.connect("enter-notify-event", () =>
        button.get_window().set_cursor(Gdk.Cursor.new_from_name(display, "pointer"))
    );

    button.connect("leave-notify-event", () => button.get_window().set_cursor(defaultCursor));
};

export const CACHE_DIR = "/var/cache/greeter";
