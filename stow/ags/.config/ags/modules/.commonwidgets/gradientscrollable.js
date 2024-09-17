const { Box, Scrollable, Overlay } = Widget;

export default ({ child, layer = 0, hscroll = "never", vscroll = "automatic", setup = () => {}, ...rest }) => {
    const top = Box({ className: `gradient-top-layer${layer}` });
    const bottom = Box({ className: `gradient-bottom-layer${layer}` });
    return Overlay({
        passThrough: true,
        child: Scrollable({
            ...rest,
            hscroll,
            vscroll,
            child,
            setup: self => {
                const updateGradients = () => {
                    const pos = self.get_vadjustment().get_value();
                    const height = self.get_allocated_height();
                    const gradHeight = height * 0.1;
                    const atTop = pos <= 0;
                    const atBottom = child.get_allocated_height() - pos - height <= 0;
                    top.css = `min-height: ${atTop ? 0 : gradHeight}px;`;
                    bottom.css = `min-height: ${atBottom ? 0 : gradHeight}px;`;
                };

                // Update gradients on scrollbar move + child resize
                self.get_vscrollbar().connect("value-changed", updateGradients);
                child.connect("size-allocate", updateGradients);

                // Extra setup
                setup();
            },
        }),
        overlays: [
            Box({ vertical: true, setup: self => self.pack_start(top, false, false, 0) }),
            Box({ vertical: true, setup: self => self.pack_end(bottom, false, false, 0) }),
        ],
    });
};
