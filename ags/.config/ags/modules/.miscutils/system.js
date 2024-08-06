import Gdk from "gi://Gdk";
const { exec, execAsync, readFile } = Utils;
const Audio = await Service.import("audio");
const Hyprland = await Service.import("hyprland");
import { CACHE_DIR } from "../../constants.js";

export const distroID = exec(`bash -c 'cat /etc/os-release | grep "^ID=" | cut -d "=" -f 2 | sed "s/\\"//g"'`).trim();
export const isDebianDistro =
    distroID === "linuxmint" ||
    distroID === "ubuntu" ||
    distroID === "debian" ||
    distroID === "zorin" ||
    distroID === "popos" ||
    distroID === "raspbian" ||
    distroID === "kali";
export const isArchDistro = distroID === "arch" || distroID === "endeavouros" || distroID === "cachyos";
export const hasFlatpak = !!exec(`bash -c 'command -v flatpak'`);

const LIGHTDARK_FILE_LOCATION = `${CACHE_DIR}/user/colormode.txt`;
export const darkMode = Variable(readFile(LIGHTDARK_FILE_LOCATION).split("\n")[0].trim() !== "light");
darkMode.connect("changed", ({ value }) => {
    let lightdark = value ? "dark" : "light";
    execAsync([
        "bash",
        "-c",
        `mkdir -p ${CACHE_DIR}/user && sed -i "1s/.*/${lightdark}/"  ${CACHE_DIR}/user/colormode.txt`,
    ])
        .then(() => execAsync(`${App.configDir}/scripts/color_generation/switchcolor.sh`).catch(print))
        .catch(print);
});
export const hasPlasmaIntegration = !!exec('bash -c "command -v plasma-browser-integration-host"');

export const getDistroIcon = () => {
    // Arches
    if (distroID == "arch") return "arch-symbolic";
    if (distroID == "endeavouros") return "endeavouros-symbolic";
    if (distroID == "cachyos") return "cachyos-symbolic";
    // Funny flake
    if (distroID == "nixos") return "nixos-symbolic";
    // Cool thing
    if (distroID == "fedora") return "fedora-symbolic";
    // Debians
    if (distroID == "linuxmint") return "ubuntu-symbolic";
    if (distroID == "ubuntu") return "ubuntu-symbolic";
    if (distroID == "debian") return "debian-symbolic";
    if (distroID == "zorin") return "ubuntu-symbolic";
    if (distroID == "popos") return "ubuntu-symbolic";
    if (distroID == "raspbian") return "debian-symbolic";
    if (distroID == "kali") return "debian-symbolic";
    return "linux-symbolic";
};

export const getDistroName = () => {
    // Arches
    if (distroID == "arch") return "Arch Linux";
    if (distroID == "endeavouros") return "EndeavourOS";
    if (distroID == "cachyos") return "CachyOS";
    // Funny flake
    if (distroID == "nixos") return "NixOS";
    // Cool thing
    if (distroID == "fedora") return "Fedora";
    // Debians
    if (distroID == "linuxmint") return "Linux Mint";
    if (distroID == "ubuntu") return "Ubuntu";
    if (distroID == "debian") return "Debian";
    if (distroID == "zorin") return "Zorin";
    if (distroID == "popos") return "Pop!_OS";
    if (distroID == "raspbian") return "Raspbian";
    if (distroID == "kali") return "Kali Linux";
    return "Linux";
};

export const range = (length, start = 1) => Array.from({ length }, (_, i) => i + start);

export const forMonitors = fn =>
    range(Gdk.Display.get_default()?.get_n_monitors() || 1, 0)
        .map(fn)
        .flat(1);

export const isUsingHeadphones = () => /head(phone|set)/i.test(Audio.speaker?.stream?.port);

export const hasTouchscreen = exec("bash -c 'udevadm info --export-db | grep ID_INPUT_TOUCHSCREEN=1'").trim() !== "";

export const dispatch = dispatcher => Hyprland.messageAsync(`dispatch ${dispatcher}`).catch(print);
