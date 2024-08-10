import Gtk from "gi://Gtk";
import { clamp } from "../.miscutils/mathfuncs.js";

// -- Styling --
// min-height for diameter
// min-width for trough stroke
// padding for space between trough and progress
// margin for space between widget and parent
// background-color for trough colour
// color for progress colour
// -- Usage --
// font size for progress value (0-100px) (hacky i know, but i want animations)
export const AnimatedCircProg = ({
    initFrom = 0,
    initTo = initFrom,
    initAnimTime = 2900,
    initDelay = 10,
    extraSetup = () => {},
    ...rest
}) =>
    Widget.DrawingArea({
        ...rest,
        css: `font-size: ${initFrom}px;`,
        attribute: {
            initDelay,
            value: initFrom,
            updateProgress: (self, value, animTime = -1) => {
                value = clamp(value, 0, 100);
                self.css = `font-size: ${value}px;` + (animTime > -1 ? `transition: ${animTime}ms linear` : "");
                self.attribute.value = value;
            },
            stop: self =>
                (self.css = `font-size: ${self
                    .get_style_context()
                    .get_property("font-size", Gtk.StateFlags.NORMAL)}px;`),
        },
        setup: self => {
            self.connect("draw", (area, cr) => {
                const styleContext = area.get_style_context();
                const width = styleContext.get_property("min-height", Gtk.StateFlags.NORMAL);
                const height = styleContext.get_property("min-height", Gtk.StateFlags.NORMAL);
                const padding = styleContext.get_padding(Gtk.StateFlags.NORMAL).left;
                const marginLeft = styleContext.get_margin(Gtk.StateFlags.NORMAL).left;
                const marginRight = styleContext.get_margin(Gtk.StateFlags.NORMAL).right;
                const marginTop = styleContext.get_margin(Gtk.StateFlags.NORMAL).top;
                const marginBottom = styleContext.get_margin(Gtk.StateFlags.NORMAL).bottom;
                area.set_size_request(width + marginLeft + marginRight, height + marginTop + marginBottom);

                const progressValue = styleContext.get_property("font-size", Gtk.StateFlags.NORMAL) / 100.0;

                const bg_stroke = styleContext.get_property("min-width", Gtk.StateFlags.NORMAL);
                const fg_stroke = bg_stroke - padding;
                const radius = Math.min(width, height) / 2.0 - Math.max(bg_stroke, fg_stroke) / 2.0;
                const center_x = width / 2.0 + marginLeft;
                const center_y = height / 2.0 + marginTop;
                const start_angle = -Math.PI / 2.0;
                const end_angle = start_angle + 2 * Math.PI * progressValue;
                const start_x = center_x + Math.cos(start_angle) * radius;
                const start_y = center_y + Math.sin(start_angle) * radius;
                const end_x = center_x + Math.cos(end_angle) * radius;
                const end_y = center_y + Math.sin(end_angle) * radius;

                // Draw background
                const backgroundColour = styleContext.get_property("background-color", Gtk.StateFlags.NORMAL);
                cr.setSourceRGBA(
                    backgroundColour.red,
                    backgroundColour.green,
                    backgroundColour.blue,
                    backgroundColour.alpha
                );
                cr.arc(center_x, center_y, radius, 0, 2 * Math.PI);
                cr.setLineWidth(bg_stroke);
                cr.stroke();

                if (progressValue == 0) return;

                // Draw progress
                const colour = styleContext.get_property("color", Gtk.StateFlags.NORMAL);
                cr.setSourceRGBA(colour.red, colour.green, colour.blue, colour.alpha);
                cr.arc(center_x, center_y, radius, start_angle, end_angle);
                cr.setLineWidth(fg_stroke);
                cr.stroke();

                // Draw rounded ends for progress arcs
                cr.setLineWidth(0);
                cr.arc(start_x, start_y, fg_stroke / 2, 0, 0 - 0.01);
                cr.fill();
                cr.arc(end_x, end_y, fg_stroke / 2, 0, 0 - 0.01);
                cr.fill();
            });

            // Init animation
            if (initFrom != initTo)
                Utils.timeout(initDelay, () => self.attribute.updateProgress(self, initTo, initAnimTime - initDelay));
            extraSetup(self);
        },
    });
