const { Box, Icon, Label, Slider, Stack } = Widget;
const Audio = await Service.import("audio");
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import { RoundedScrollable } from "../../.commonwidgets/cairo_roundedscrollable.js";
import { setupCursorHover } from "../../.widgetutils/cursorhover.js";
// import { AnimatedSlider } from "../../.commonwidgets/cairo_slider.js";

const AppVolume = stream =>
    Box({
        className: "sidebar-volmixer-stream spacing-h-10",
        children: [
            Icon({
                className: "sidebar-volmixer-stream-appicon",
                vpack: "center",
                tooltipText: stream.stream.name,
                icon: stream.bind("stream").as(s => s.get_icon_name()),
            }),
            Box({
                hexpand: true,
                vpack: "center",
                vertical: true,
                className: "spacing-v-5",
                children: [
                    Box({
                        children: [
                            Label({
                                hexpand: true,
                                xalign: 0,
                                maxWidthChars: 10,
                                truncate: "end",
                                label: stream.bind("description"),
                                className: "txt-small",
                            }),
                            Label({
                                label: stream.bind("volume").as(v => `${Math.round(v * 100)}%`),
                                className: "txt-small",
                            }),
                        ],
                    }),
                    Slider({
                        drawValue: false,
                        hpack: "fill",
                        className: "sidebar-volmixer-stream-slider",
                        value: stream.bind("volume"),
                        min: 0,
                        max: 1,
                        onChange: ({ value }) => (stream.volume = value),
                        setup: setupCursorHover,
                    }),
                    // AnimatedSlider({
                    //     hpack: "fill",
                    //     className: "sidebar-volmixer-stream-slider",
                    //     initFrom: stream.volume * 100,
                    //     onChange: value => (stream.volume = value),
                    //     extraSetup: self => self.hook(stream, () => self.attribute.updateProgress(stream.volume * 100)),
                    // }),
                ],
            }),
        ],
    });

export default (props = {}) => {
    const emptyContent = Box({
        vertical: true,
        vpack: "center",
        className: "spacing-v-5 txt-subtext",
        children: [
            MaterialIcon("brand_awareness", "gigantic"),
            Label({ label: "No audio source", className: "txt-small" }),
        ],
    });
    const appList = RoundedScrollable({
        vexpand: true,
        overlayClass: "sidebar-scrollcorner1",
        child: Box({
            vertical: true,
            className: "spacing-v-5",
            children: Audio.bind("apps").as(a => a.map(AppVolume)),
        }),
    });
    const status = Box({
        className: "sidebar-volmixer-status spacing-h-5",
        children: [
            Label({
                className: "txt-small margin-top-5 margin-bottom-8",
                attribute: { headphones: undefined },
                setup: self => {
                    const updateAudioDevice = self => {
                        const usingHeadphones = Audio.speaker?.stream?.port?.toLowerCase().includes("headphone");
                        if (self.attribute.headphones === undefined || self.attribute.headphones !== usingHeadphones) {
                            self.attribute.headphones = usingHeadphones;
                            self.label = `Output: ${usingHeadphones ? "Headphones" : "Speakers"}`;
                        }
                    };
                    self.hook(Audio, updateAudioDevice);
                },
            }),
        ],
    });
    const mainContent = Stack({
        children: {
            empty: emptyContent,
            list: appList,
        },
        shown: Audio.bind("apps").as(a => (a.length > 0 ? "list" : "empty")),
    });
    return Box({
        ...props,
        className: "spacing-v-5",
        vertical: true,
        children: [mainContent, status],
    });
};
