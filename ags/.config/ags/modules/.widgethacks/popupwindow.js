const { Box, Window } = Widget;

export default ({ name, child, showClassName = "", hideClassName = "", escFn = closeEverything, ...props }) =>
    Window({
        name,
        visible: false,
        layer: "overlay",
        ...props,
        child: Box({
            setup: self => {
                self.keybind("Escape", escFn);
                if (showClassName !== "" && hideClassName !== "") {
                    self.hook(App, (self, currentName, visible) => {
                        if (currentName === name) self.toggleClassName(hideClassName, !visible);
                    });

                    self.className = `${showClassName} ${hideClassName}`;
                }
            },
            children: [child],
        }),
    });
