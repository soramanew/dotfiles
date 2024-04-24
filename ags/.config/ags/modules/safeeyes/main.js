import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import SafeEyesScreen from "./safeeyesscreen.js";

export default () => Widget.Window({
    name: "safeeyes",
    popup: true,
    visible: false,
    keymode: "exclusive",
    layer: "overlay",
    exclusivity: "ignore",
    // anchor: ['top', 'bottom', 'left', 'right'],
    child: SafeEyesScreen(),
})
