import Cairo from "cairo";

export const dummyRegion = new Cairo.Region();
const setRegion = self => self.window.input_shape_combine_region(dummyRegion, 0, 0);
export const enableClickthrough = self => {
    self.hook(
        App,
        (_, name, visible) => {
            if (visible && name == self.name) setRegion(self);
        },
        "window-toggled"
    );
    Utils.timeout(1, () => setRegion(self));
};
