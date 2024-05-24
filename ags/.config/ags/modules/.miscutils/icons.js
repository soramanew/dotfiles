import Gtk from "gi://Gtk";

export const iconExists = iconName => Gtk.IconTheme.get_default().has_icon(iconName);

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

const regexSubs = [{ regex: /^steam_app_(\d+)$/, replace: "steam_icon_$1" }];

export const substitute = str => {
    // Normal subs
    if (substitutions.hasOwnProperty(str)) return substitutions[str];

    // Regex subs
    for (const sub of regexSubs) {
        const postSub = str.replace(sub.regex, sub.replace);
        if (postSub !== str) return postSub;
    }

    // Guess icon name: turn into kebab case
    if (!iconExists(str)) str = str.toLowerCase().replace(/\s+/g, "-");

    // Not changed
    return str;
};
