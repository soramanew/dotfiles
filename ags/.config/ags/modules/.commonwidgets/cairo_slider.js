import Gdk from "gi://Gdk";
import Gtk from "gi://Gtk";
const { EventBox, DrawingArea } = Widget;
import { clamp } from "../.miscutils/mathfuncs.js";
import { setupCursorHover } from "../.widgetutils/cursorhover.js";

export const AnimatedSlider = ({
    initFrom = 0,
    initTo = 0,
    initAnimTime = 2900,
    onChange = () => {},
    extraSetup = () => {},
    ...rest
}) => {
    const updateProgress = (value, animTime = -1) =>
        (drawingArea.css =
            `font-size: ${clamp(value, 0, 100)}px;` + (animTime > -1 ? `transition: ${animTime}ms linear` : ""));
    const drawingArea = DrawingArea({
        ...rest,
        css: `font-size: ${initFrom}px;`,
        attribute: { updateProgress },
        setup: self => {
            const HALF_PI = Math.PI / 2;
            self.connect("draw", (self, cr) => {
                const styleContext = self.get_style_context();
                const width = self.get_allocated_width();
                const height = styleContext.get_property("min-height", Gtk.StateFlags.NORMAL);
                const radiusMult = styleContext.get_property("border-radius", Gtk.StateFlags.NORMAL) / 100;
                let radius = (Math.min(width, height) / 2) * radiusMult;
                self.set_size_request(width, height);

                const bgColour = styleContext.get_property("background-color", Gtk.StateFlags.NORMAL);
                cr.setSourceRGBA(bgColour.red, bgColour.green, bgColour.blue, bgColour.alpha);
                cr.arc(radius, radius, radius, -Math.PI, -HALF_PI); // Top-left
                cr.arc(width - radius, radius, radius, -HALF_PI, 0); // Top-right
                cr.arc(width - radius, height - radius, radius, 0, HALF_PI); // Bottom-right
                cr.arc(radius, height - radius, radius, HALF_PI, Math.PI); // Bottom-left
                cr.closePath();
                cr.fill();

                const progressValue = styleContext.get_property("font-size", Gtk.StateFlags.NORMAL) / 100;
                onChange(progressValue);
                if (progressValue === 0) return;

                const colour = styleContext.get_property("color", Gtk.StateFlags.NORMAL);
                cr.setSourceRGBA(colour.red, colour.green, colour.blue, colour.alpha);

                radius = (Math.min(progressValue * width, height) / 2) * radiusMult;
                const progressWidth = width * progressValue - radius;
                cr.arc(radius, radius, radius, -Math.PI, -HALF_PI); // Top-left
                cr.arc(progressWidth, radius, radius, -HALF_PI, 0); // Top-right
                cr.arc(progressWidth, height - radius, radius, 0, HALF_PI); // Bottom-right
                cr.arc(radius, height - radius, radius, HALF_PI, Math.PI); // Bottom-left
                cr.closePath();
                cr.fill();
            });

            extraSetup(self);
            if (initFrom != initTo) Utils.timeout(10, () => updateProgress(initTo, initAnimTime), self);
        },
    });
    return EventBox({
        aboveChild: true,
        visibleWindow: false,
        attribute: { updateProgress, clicked: false },
        child: drawingArea,
        onPrimaryClick: (self, event) => {
            self.attribute.clicked = true;
            const cursorX = event.get_coords()[1];
            const widgetWidth = self.get_allocated_width();
            updateProgress((cursorX / widgetWidth) * 100);
        },
        onPrimaryClickRelease: self => (self.attribute.clicked = false),
        setup: self => {
            self.add_events(Gdk.EventMask.POINTER_MOTION_MASK);
            self.on("motion-notify-event", (self, event) => {
                if (!self.attribute.clicked) return;
                const cursorX = event.get_coords()[1];
                const widgetWidth = self.get_allocated_width();
                updateProgress((cursorX / widgetWidth) * 100);
            });
            setupCursorHover(self);
        },
    });
};
