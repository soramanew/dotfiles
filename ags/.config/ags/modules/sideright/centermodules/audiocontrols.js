const { Box, Button, Icon, Label, Revealer, Slider, Stack } = Widget;
const Audio = await Service.import("audio");
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import { RoundedScrollable } from "../../.commonwidgets/cairo_roundedscrollable.js";
import { setupCursorHover } from "../../.widgetutils/cursorhover.js";
import { iconExists } from "../../.miscutils/icons.js";
// import { AnimatedSlider } from "../../.commonwidgets/cairo_slider.js";

const AppVolume = stream =>
    Box({
        className: "sidebar-volmixer-stream spacing-h-10",
        children: [
            Icon({
                className: "sidebar-volmixer-stream-appicon",
                vpack: "center",
                tooltipText: Utils.merge(
                    [stream.bind("stream"), stream.bind("description")],
                    (stream, desc) => `${stream.name} • ${desc}`
                ),
                icon: stream.bind("icon-name"),
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
                                maxWidthChars: 1,
                                truncate: "end",
                                label: Utils.merge(
                                    [stream.bind("stream"), stream.bind("description")],
                                    (stream, desc) => `${stream.name} • ${desc}`
                                ),
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

const AudioDevices = input => {
    const type = input ? "microphone" : "speaker";
    const matIcon = input ? "mic_external_on" : "media_output";
    const dropdownShown = Variable(false);
    const DeviceStream = stream =>
        Button({
            child: Box({
                className: "txt spacing-h-10",
                children: [
                    iconExists(stream.iconName)
                        ? Icon({ className: "txt-norm symbolic-icon", icon: stream.bind("iconName") })
                        : MaterialIcon(matIcon, "norm"),
                    Label({
                        hexpand: true,
                        xalign: 0,
                        className: "txt-small",
                        truncate: "end",
                        maxWidthChars: 1,
                        label: stream.description,
                        tooltipText: stream.description,
                    }),
                ],
            }),
            onClicked: () => {
                Audio[type] = stream;
                dropdownShown.value = false;
            },
            setup: setupCursorHover,
        });
    const activeDevice = Button({
        onClicked: () => (dropdownShown.value = !dropdownShown.value),
        child: Box({
            className: "txt spacing-h-10",
            children: [
                MaterialIcon(matIcon, "norm"),
                Label({
                    hexpand: true,
                    xalign: 0,
                    className: "txt-small",
                    truncate: "end",
                    maxWidthChars: 1,
                    label: Audio[type].bind("description").as(desc => `${input ? "[In]" : "[Out]"} ${desc}`),
                }),
                Label({
                    className: `icon-material txt-norm`,
                    label: dropdownShown.bind().as(shown => "expand_" + (shown ? "less" : "more")),
                }),
            ],
        }),
        setup: setupCursorHover,
    });
    const deviceSelector = Revealer({
        transition: "slide_down",
        revealChild: dropdownShown.bind(),
        transitionDuration: 150,
        child: Box({
            vertical: true,
            children: [
                Box({ className: "separator-line margin-top-5 margin-bottom-5" }),
                Box({
                    vertical: true,
                    className: "spacing-v-5 margin-top-5",
                    children: Audio.bind(type + "s").as(streams => streams.map(DeviceStream)),
                }),
            ],
        }),
    });
    return Box({
        hpack: "fill",
        className: "sidebar-volmixer-deviceselector",
        vertical: true,
        children: [activeDevice, deviceSelector],
    });
};

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
    const devices = Box({
        vertical: true,
        className: "spacing-v-5",
        children: [AudioDevices(false), AudioDevices(true)],
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
        children: [mainContent, devices],
    });
};
