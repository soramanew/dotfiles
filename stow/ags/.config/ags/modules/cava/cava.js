import Gtk from "gi://Gtk";

export default ({
    spacing = 2,
    vertical = false,
    width = null,
    bars = width === null ? 20 : Math.floor(width / (10 + spacing)),
    barHeight = 100,
    align = "end",
    smooth = false,
    ...rest
} = {}) =>
    Widget.DrawingArea({
        ...rest,
        className: "cava",
        attribute: {
            cavaVar: Variable([], {
                listen: [
                    [
                        "bash",
                        "-c",
                        `printf "[general]\n  \
sleep_timer=30\n    \
framerate=60\n    \
bars = ${bars}\n  \
[input]\n \
method = pipewire\n \
[output]\n        \
method = raw\n    \
raw_target = /dev/stdout\n \
data_format = ascii\n \
ascii_max_range = ${barHeight}\n" | \
cava -p /dev/stdin`,
                    ],
                    out => out.split(";").slice(0, -1),
                ],
            }),
        },
        setup: self => {
            if (vertical) self.set_size_request(barHeight, width || 0);
            else self.set_size_request(width || 0, barHeight);
            const varHandler = self.attribute.cavaVar.connect("changed", () => self.queue_draw());
            self.on("destroy", () => {
                self.attribute.cavaVar.stopListen();
                self.attribute.cavaVar.disconnect(varHandler);
            });
            self.on("draw", (self, cr) => {
                const context = self.get_style_context();
                const h = self.get_allocated_height();
                const w = self.get_allocated_width();
                const realBars = self.attribute.cavaVar.value.length;

                if (!smooth) {
                    const barSize = ((vertical ? h : w) - spacing * (realBars - 1)) / realBars;
                    for (let i = 0; i < realBars; i++) {
                        const height = h * (self.attribute.cavaVar.value[i] / barHeight);
                        let y = 0;
                        let x = 0;
                        switch (align) {
                            case "start":
                                y = 0;
                                x = 0;
                                break;
                            case "center":
                                y = (h - height) / 2;
                                x = (w - height) / 2;
                                break;
                            case "end":
                            default:
                                y = h - height;
                                x = w - height;
                                break;
                        }
                        if (vertical) cr.rectangle(x, i * (barSize + spacing), height, barSize);
                        else cr.rectangle(i * (barSize + spacing), y, barSize, height);
                    }
                } else {
                    let lastX = 0;
                    let lastY = h - h * (self.attribute.cavaVar.value[0] / barHeight);
                    cr.moveTo(lastX, lastY);
                    for (let i = 1; i < self.attribute.cavaVar.value.length; i++) {
                        const height = h * (self.attribute.cavaVar.value[i] / barHeight);
                        let y = h - height;
                        cr.curveTo(
                            lastX + w / (realBars - 1) / 2,
                            lastY,
                            lastX + w / (realBars - 1) / 2,
                            y,
                            i * (w / (realBars - 1)),
                            y
                        );
                        lastX = i * (w / (realBars - 1));
                        lastY = y;
                    }
                    cr.lineTo(w, h);
                    cr.lineTo(0, h);
                }
                cr.clip();
                Gtk.render_background(context, cr, 0, 0, w, h);
            });
        },
    });
