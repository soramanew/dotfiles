const Cairo = imports.cairo;

export const dummyRegion = new Cairo.Region();
export const enableClickthrough = self => self.input_shape_combine_region(dummyRegion);
