import Cairo from "cairo";

export const dummyRegion = new Cairo.Region();
export const enableClickthrough = self =>
    Utils.timeout(1, () => self.on("size-allocate", () => self.window.input_shape_combine_region(dummyRegion, 0, 0)));
