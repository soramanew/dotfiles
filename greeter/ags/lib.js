import Gdk from "gi://Gdk";
const Hyprland = await Service.import("hyprland");

const display = Gdk.Display.get_default();
const defaultCursor = Gdk.Cursor.new_from_name(display, "default");
export const setupCursorHover = button => {
    button.connect("enter-notify-event", () =>
        button.get_window().set_cursor(Gdk.Cursor.new_from_name(display, "pointer"))
    );

    button.connect("leave-notify-event", () => button.get_window().set_cursor(defaultCursor));
};

export const CACHE_DIR = "/var/cache/greeter";

const chooseBackground = () => {
    const lastBackground = Utils.readFile(`${CACHE_DIR}/last-background.txt`);
    const { width, height } = JSON.parse(Hyprland.message("j/monitors"))[0];
    const backgrounds = Utils.exec(`find ${App.configDir}/backgrounds/ -type f -not -wholename '${lastBackground}'`)
        .split("\n")
        // Filter by size
        .filter(b => {
            const [w, h] = Utils.exec(`identify -ping -format '%w %h' ${b}`).split(" ");
            return w > width * 0.8 && h > height * 0.8;
        });

    // No other backgrounds in folder
    if (!backgrounds.length) return lastBackground;

    // Get random
    const background = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    Utils.writeFile(background, `${CACHE_DIR}/last-background.txt`).catch(print);
    return background;
};

export const background = chooseBackground();
