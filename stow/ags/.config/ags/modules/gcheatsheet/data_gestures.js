export const gestureList = [
    [
        {
            icon: "pin_drop",
            name: "Workspaces: navigation",
            binds: [
                { keys: ["Swipe", "3", "to", "left"], action: "Go to workspace -1" },
                { keys: ["Swipe", "3", "to", "right"], action: "Go to workspace +1" },
            ],
            id: 1,
        },
        {
            icon: "overview_key",
            name: "Workspaces: management",
            binds: [
                { keys: ["Swipe", "3", "to", "left", "up"], action: "Move window to workspace on the left" },
                { keys: ["Swipe", "3", "to", "right", "up"], action: "Move window to workspace on the right" },
            ],
            id: 2,
        },
        {
            icon: "move_group",
            name: "Windows",
            binds: [
                { keys: ["Swipe", "4", "to", "down"], action: "Kill window" },
                { keys: ["Hold", "2"], action: "Move window" },
                { keys: ["Hold", "3"], action: "Resize window" },
                { keys: ["Hold", "4"], action: "Toggle floating" },
                { keys: ["Hold", "5"], action: "Fullscreen" },
            ],
            id: 3,
        },
    ],
    [
        {
            icon: "widgets",
            name: "Widgets (AGS)",
            binds: [
                { keys: ["Edge", "bottom", "to", "right", "up"], action: "Toggle overview/launcher" },
                { keys: ["Edge", "bottom", "to", "left", "up"], action: "Toggle fullscreen app launcher" },
                { keys: ["Tap", "4"], action: "Toggle this cheatsheet" },
                { keys: ["Edge", "right", "to", "left"], action: "Toggle system (right) sidebar" },
                { keys: ["Edge", "left", "to", "right"], action: "Toggle utilities (left) sidebar" },
                { keys: ["Edge", "bottom", "to", "up"], action: "Toggle virtual keyboard" },
                { keys: ["Tap", "5"], action: "Power/Session menu" },
            ],
            id: 4,
        },
        {
            icon: "construction",
            name: "Utilities",
            binds: [
                { keys: ["Edge", "right", "to", "up"], action: "Increase brightness" },
                { keys: ["Edge", "right", "to", "down"], action: "Decrease brightness" },
            ],
        },
    ],
];
