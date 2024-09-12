import Gtk from "gi://Gtk";
const Applications = await Service.import("applications");

export const iconExists = iconName => Gtk.IconTheme.get_default().has_icon(iconName);

const substitutions = {
    "": "image-missing",
    // Mime types
    "text-plain": "text-x-generic",
    "application-x-zerosize": "text-x-generic",
    // Applications
    "code-url-handler": "visual-studio-code",
    code: "visual-studio-code",
    "codium-url-handler": "vscodium",
    codium: "vscodium",
    "GitHub Desktop": "github-desktop",
    "gnome-tweaks": "org.gnome.tweaks",
    "org.pulseaudio.pavucontrol": "pavucontrol",
    "pavucontrol-qt": "pavucontrol",
    "jetbrains-pycharm-ce": "pycharm-community",
    "Spotify Free": "Spotify",
    safeeyes: "io.github.slgobinath.SafeEyes",
    "yad-icon-browser": "yad",
    xterm: "uxterm",
    "com-atlauncher-App": "atlauncher",
    avidemux3_qt5: "avidemux",
};

const regexSubs = [
    { regex: /^steam_app_(\d+)$/, replace: "steam_icon_$1" },
    { regex: /^Minecraft\* [0-9\.]+$/, replace: "minecraft" },
];

export const substitute = str => {
    // Normal subs
    if (substitutions.hasOwnProperty(str)) return substitutions[str];

    // Regex subs
    for (const sub of regexSubs) {
        const postSub = str.replace(sub.regex, sub.replace);
        if (postSub !== str) return postSub;
    }

    // Try to find a matching .desktop file and use the specified icon
    const apps = Applications.query(str);
    if (apps.length > 0) return apps[0].iconName;

    // Not changed
    return str;
};
