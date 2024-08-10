// This file is for brightness/volume indicators
const { Box, Label, EventBox, Revealer } = Widget;
const Audio = await Service.import("audio");
import Brightness from "../../services/brightness.js";
import Indicator from "../../services/indicator.js";
import { AnimatedSlider } from "../.commonwidgets/cairo_slider.js";
import { isUsingHeadphones } from "../.miscutils/system.js";

const OsdValue = ({
    name,
    nameSetup = () => {},
    labelSetup,
    progressSetup,
    extraClassName = "",
    extraProgressClassName = "",
    ...rest
}) =>
    Box({
        vertical: true,
        hexpand: true,
        className: `osd-bg osd-value ${extraClassName}`,
        children: [
            Box({
                vexpand: true,
                children: [
                    Label({
                        xalign: 0,
                        hexpand: true,
                        className: "osd-label",
                        label: name,
                        setup: nameSetup,
                    }),
                    Label({
                        hexpand: false,
                        className: "osd-value-txt",
                        setup: labelSetup,
                    }),
                ],
            }),
            AnimatedSlider({
                className: `osd-progress ${extraProgressClassName}`,
                hexpand: true,
                extraSetup: progressSetup,
            }),
        ],
        ...rest,
    });

export default () => {
    const brightnessIndicator = OsdValue({
        name: "Brightness",
        extraClassName: "osd-brightness",
        extraProgressClassName: "osd-brightness-progress",
        labelSetup: self =>
            self.hook(
                Brightness,
                self => (self.label = String(Math.round(Brightness.screen_value * 100))),
                "notify::screen-value"
            ),
        progressSetup: self =>
            self.hook(
                Brightness,
                self => {
                    const updateValue = Brightness.screen_value * 100;
                    if (updateValue !== self.attribute.value) {
                        Indicator.popup(1);
                        self.attribute.updateProgress(updateValue);
                    }
                },
                "notify::screen-value"
            ),
    });

    const volumeIndicator = OsdValue({
        name: "Volume",
        extraClassName: "osd-volume",
        extraProgressClassName: "osd-volume-progress",
        attribute: { headphones: undefined, muted: Audio.speaker?.stream?.isMuted },
        nameSetup: self =>
            self.hook(Audio, self => {
                const usingHeadphones = isUsingHeadphones();
                if (volumeIndicator.attribute.headphones !== usingHeadphones) {
                    volumeIndicator.attribute.headphones = usingHeadphones;
                    self.label = usingHeadphones ? "Headphones" : "Speakers";
                    Indicator.popup(1);
                }
                self.toggleClassName("osd-volume-disabled", Audio.speaker?.stream?.isMuted);
            }),
        labelSetup: self =>
            self.hook(Audio, self => {
                self.label = String(Math.round(Audio.speaker?.volume * 100));
                self.toggleClassName("osd-volume-disabled", Audio.speaker?.stream?.isMuted);
            }),
        progressSetup: self =>
            self.hook(Audio, self => {
                let updateValue = Audio.speaker?.volume;
                if (!isNaN(updateValue)) {
                    updateValue *= 100;
                    if (updateValue !== self.attribute.value) {
                        Indicator.popup(1);
                        self.attribute.updateProgress(updateValue);
                    }
                }
                const muted = Audio.speaker?.stream?.isMuted;
                if (muted !== volumeIndicator.attribute.muted) {
                    Indicator.popup(1);
                    self.toggleClassName("osd-volume-progress-disabled", muted);
                    volumeIndicator.attribute.muted = muted;
                }
            }),
    });

    return EventBox({
        onHover: () => Indicator.popup(-1),
        child: Revealer({
            transition: "slide_down",
            transitionDuration: 200,
            revealChild: false,
            setup: self =>
                self.hook(
                    Indicator,
                    (self, value) => {
                        if (value > -1) self.revealChild = true;
                        else self.revealChild = false;
                    },
                    "popup"
                ),
            child: Box({
                hpack: "center",
                className: "spacing-h--10",
                children: [brightnessIndicator, volumeIndicator],
            }),
        }),
    });
};
