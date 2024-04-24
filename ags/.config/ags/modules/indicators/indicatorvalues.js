// This file is for brightness/volume indicators
const { Box, Label } = Widget;
const Audio = await Service.import("audio");
import { MarginRevealer } from "../.widgethacks/advancedrevealers.js";
import Brightness from "../../services/brightness.js";
import Indicator from "../../services/indicator.js";
import { AnimatedSlider } from "../.commonwidgets/cairo_slider.js";

const OsdValue = ({
    name,
    nameSetup = undefined,
    labelSetup,
    progressSetup,
    extraClassName = "",
    extraProgressClassName = "",
    ...rest
}) => {
    const valueName = Label({
        xalign: 0,
        yalign: 0,
        hexpand: true,
        className: "osd-label",
        label: name,
        setup: nameSetup,
    });
    const valueNumber = Label({
        hexpand: false,
        className: "osd-value-txt",
        setup: labelSetup,
    });
    return Box({
        // Volume
        vertical: true,
        hexpand: true,
        className: `osd-bg osd-value ${extraClassName}`,
        attribute: { disable: () => (valueNumber.label = "󰖭") },
        children: [
            Box({
                vexpand: true,
                children: [valueName, valueNumber],
            }),
            AnimatedSlider({
                className: `osd-progress ${extraProgressClassName}`,
                hexpand: true,
                extraSetup: progressSetup,
            }),
        ],
        ...rest,
    });
};

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
                self => self.attribute.updateProgress(Brightness.screen_value * 100),
                "notify::screen-value"
            ),
    });

    const volumeIndicator = OsdValue({
        name: "Volume",
        extraClassName: "osd-volume",
        extraProgressClassName: "osd-volume-progress",
        attribute: { headphones: undefined },
        nameSetup: self =>
            Utils.timeout(1, () => {
                const updateAudioDevice = label => {
                    if (!label) return;
                    const usingHeadphones = Audio.speaker?.stream?.port?.toLowerCase().includes("headphone");
                    if (volumeIndicator.attribute.headphones !== usingHeadphones) {
                        volumeIndicator.attribute.headphones = usingHeadphones;
                        label.label = usingHeadphones ? "Headphones" : "Speakers";
                        Indicator.popup(1);
                    }
                    label.toggleClassName("osd-volume-disabled", Audio.speaker?.stream?.isMuted);
                };
                self.hook(Audio, updateAudioDevice);
                Utils.timeout(1000, updateAudioDevice);
            }),
        labelSetup: self =>
            self.hook(Audio, label => {
                label.label = String(Math.round(Audio.speaker?.volume * 100));
                label.toggleClassName("osd-volume-disabled", Audio.speaker?.stream?.isMuted);
            }),
        progressSetup: self =>
            self.hook(Audio, self => {
                const updateValue = Audio.speaker?.volume;
                if (!isNaN(updateValue)) self.attribute.updateProgress(updateValue * 100);
                self.toggleClassName("osd-volume-progress-disabled", Audio.speaker?.stream?.isMuted);
            }),
    });

    return MarginRevealer({
        transition: "slide_down",
        showClass: "osd-show",
        hideClass: "osd-hide",
        extraSetup: self =>
            self.hook(
                Indicator,
                (revealer, value) => {
                    if (value > -1) revealer.attribute.show();
                    else revealer.attribute.hide();
                },
                "popup"
            ),
        child: Box({
            hpack: "center",
            vertical: false,
            className: "spacing-h--10",
            children: [brightnessIndicator, volumeIndicator],
        }),
    });
};
