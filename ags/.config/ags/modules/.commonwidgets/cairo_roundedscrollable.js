const { Scrollable, Overlay } = Widget;
import { RoundedCorner } from "./cairo_roundedcorner.js";

export const RoundedScrollable = ({ child, overlayClass = "", ...rest }) =>
    Overlay({
        child: Scrollable({ child, ...rest }),
        // overlays: ["topleft", "topright", "bottomleft", "bottomright"].map(place =>
        //     RoundedCorner(place, { className: overlayClass })
        // ),
    });
