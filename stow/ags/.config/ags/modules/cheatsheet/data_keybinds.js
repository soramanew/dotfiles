import { actions, actionsList } from "../overview/miscfunctions.js";

export const keybindList = [
    [
        {
            icon: "pin_drop",
            name: "Workspaces: navigation",
            binds: [
                { keys: ["󰖳", "+", "#"], action: "Go to workspace #" },
                { keys: ["󰖳", "+", "S"], action: "Toggle special workspace" },
                { keys: ["󰖳", "+", "(Scroll ↑↓)"], action: "Go to workspace -1/+1" },
                { keys: ["Ctrl", "󰖳", "+", "←", "OR", "󰖳", "+", "PageUp"], action: "Go to workspace on the left" },
                { keys: ["Ctrl", "󰖳", "+", "→", "OR", "󰖳", "+", "PageDown"], action: "Go to workspace on the right" },
            ],
            id: 1,
        },
        {
            icon: "overview_key",
            name: "Workspaces: management",
            binds: [
                { keys: ["󰖳", "Alt", "+", "#"], action: "Move window to workspace #" },
                { keys: ["󰖳", "Alt", "+", "S"], action: "Move window to special workspace" },
                { keys: ["󰖳", "Alt", "+", "PageUp"], action: "Move window to workspace on the left" },
                { keys: ["󰖳", "Alt", "+", "PageDown"], action: "Move window to workspace on the right" },
            ],
            id: 2,
        },
        {
            icon: "move_group",
            name: "Windows",
            binds: [
                { keys: ["󰖳", "+", "←↑→↓"], action: "Focus window in direction" },
                { keys: ["󰖳", "Shift", "+", "←↑→↓"], action: "Swap window in direction" },
                { keys: ["󰖳", "+", "-", "OR", "󰖳", "+", ";"], action: "Split ratio -" },
                { keys: ["󰖳", "+", "=", "OR", "󰖳", "+", "'"], action: "Split ratio +" },
                { keys: ["󰖳", "+", "Lmb", "OR", "󰖳", "+", "Z"], action: "Move window" },
                { keys: ["󰖳", "+", "Rmb", "OR", "󰖳", "+", "X"], action: "Resize window" },
                { keys: ["󰖳", "+", "F"], action: "Fullscreen" },
                { keys: ["󰖳", "Alt", "+", "F"], action: "Fake fullscreen" },
                { keys: ["󰖳", "Alt", "+", "Space"], action: "Toggle floating" },
                { keys: ["Ctrl", "󰖳", "+", "\\"], action: "Center window" },
            ],
            id: 3,
        },
    ],
    [
        {
            icon: "widgets",
            name: "Widgets (AGS)",
            binds: [
                { keys: ["󰖳"], action: "Toggle overview/launcher" },
                { keys: ["Ctrl", "󰖳", "Shift", "+", "R"], action: "Restart AGS" },
                { keys: ["󰖳", "+", "/"], action: "Toggle this cheatsheet" },
                { keys: ["󰖳", "+", "N", "OR", "󰖳", "+", "Esc"], action: "Toggle system (right) sidebar" },
                {
                    keys: ["󰖳", "+", "B", "OR", "󰖳", "+", "O", "OR", "󰖳", "+", "A"],
                    action: "Toggle utilities (left) sidebar",
                },
                { keys: ["Ctrl", "󰖳", "+", "T"], action: "Toggle todo list" },
                { keys: ["󰖳", "+", "K"], action: "Toggle virtual keyboard" },
                { keys: ["Ctrl", "Alt", "+", "Del"], action: "Power/Session menu" },
            ],
            id: 4,
        },
        {
            icon: "construction",
            name: "Utilities",
            binds: [
                { keys: ["PrtSc"], action: "Screenshot  >>  clipboard" },
                { keys: ["󰖳", "Shift", "+", "S"], action: "Capture region (freeze)" },
                { keys: ["󰖳", "Shift", "Alt", "+", "S"], action: "Capture region" },
                { keys: ["󰖳", "Shift", "+", "T"], action: "Image to text  >>  clipboard" },
                { keys: ["󰖳", "Shift", "+", "C"], action: "Colour picker" },
                { keys: ["󰖳", "Alt", "+", "R"], action: "Record region" },
                { keys: ["Ctrl", "Alt", "+", "R"], action: "Record screen" },
                { keys: ["󰖳", "Shift", "Alt", "+", "R"], action: "Record screen with sound" },
                { keys: ["Ctrl", "󰖳", "+", "Space"], action: "Play/pause media" },
                { keys: ["Ctrl", "󰖳", "+", "N", "OR", "Ctrl", "󰖳", "+", "="], action: "Skip song" },
                { keys: ["Ctrl", "󰖳", "+", "P", "OR", "Ctrl", "󰖳", "+", "-"], action: "Go to previous song" },
            ],
            id: 5,
        },
    ],
    [
        {
            icon: "apps",
            name: "Apps",
            binds: [
                { keys: ["󰖳", "+", "T"], action: "Launch terminal: foot" },
                { keys: ["󰖳", "+", "W"], action: "Launch browser: Firefox" },
                { keys: ["󰖳", "+", "C"], action: "Launch editor: VSCodium" },
                { keys: ["󰖳", "+", "G"], action: "Launch git GUI: Github Desktop" },
                { keys: ["󰖳", "+", "M"], action: "Launch music player: Feishin" },
                { keys: ["󰖳", "+", "D"], action: "Launch Discord client: Vesktop" },
                { keys: ["Ctrl", "Shift", "+", "Esc"], action: "Launch system monitor: btop" },
                { keys: ["Ctrl", "Alt", "+", "Esc"], action: "Launch system monitor: qps" },
            ],
            id: 6,
        },
        {
            icon: "keyboard",
            name: "Typing",
            binds: [
                { keys: ["󰖳", "+", "V"], action: "Clipboard history  >>  clipboard" },
                { keys: ["󰖳", "+", "."], action: "Emoji picker  >>  clipboard" },
            ],
            id: 7,
        },
        {
            icon: "terminal",
            name: "Launcher actions",
            binds: actionsList.map(action => ({ keys: [`>${action}`], action: actions[action].desc })),
            id: 8,
        },
    ],
];
