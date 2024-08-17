import { enableClickthrough } from "../.widgetutils/clickthrough.js";
import { RoundedCorner } from "../.commonwidgets/cairo_roundedcorner.js";

export default (monitor = 0, where = "bottom left") => {
    const positionString = where.replaceAll(/\s/g, ""); // remove space
    return Widget.Window({
        monitor,
        name: `corner${positionString}${monitor}`,
        layer: "overlay",
        anchor: where.split(" "),
        exclusivity: "ignore",
        visible: true,
        child: RoundedCorner(positionString, { className: "corner-black" }),
        setup: enableClickthrough,
    });
};
