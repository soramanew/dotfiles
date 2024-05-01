import Gtk from "gi://Gtk";

export const iconExists = iconName => Gtk.IconTheme.get_default().has_icon(iconName);

export const substitute = str => {
    const substitutions = {
        "": "image-missing",
        "code-url-handler": "visual-studio-code",
        code: "visual-studio-code",
        "codium-url-handler": "vscodium",
        codium: "vscodium",
        "GitHub Desktop": "github-desktop",
        "Minecraft* 1.20.1": "minecraft",
        "gnome-tweaks": "org.gnome.tweaks",
        "pavucontrol-qt": "pavucontrol",
        "jetbrains-pycharm-ce": "pycharm-community",
    };
    if (substitutions.hasOwnProperty(str)) return substitutions[str];

    if (!iconExists(str)) str = str.toLowerCase().replace(/\s+/g, "-"); // Turn into kebab-case
    return str;
};
