const { Box, Button, Entry, EventBox, Label, Overlay } = Widget;
const { execAsync } = Utils;
import SidebarModule from "./module.js";
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import { setupCursorHover } from "../../.widgetutils/cursorhover.js";
import { ColorPickerSelection, hslToHex, hslToRgbValues } from "./color.js";
import { clamp } from "../../.miscutils/mathfuncs.js";

export default () => {
    const selectedColor = new ColorPickerSelection();
    function shouldUseBlackColor() {
        return (
            (selectedColor.xAxis < 40 || (45 <= selectedColor.hue && selectedColor.hue <= 195)) &&
            selectedColor.yAxis > 60
        );
    }
    const colorBlack = "rgba(0,0,0,0.9)";
    const colorWhite = "rgba(255,255,255,0.9)";
    const hueRange = Box({
        homogeneous: true,
        className: "sidebar-module-colorpicker-wrapper",
        child: Box({
            className: "sidebar-module-colorpicker-hue",
            css: "background: linear-gradient(to bottom, #ff6666, #ffff66, #66dd66, #66ffff, #6666ff, #ff66ff, #ff6666);",
        }),
    });
    const hueSlider = Box({
        vpack: "start",
        className: "sidebar-module-colorpicker-cursorwrapper",
        css: `margin-top: ${(13.636 * selectedColor.hue) / 360}rem;`,
        homogeneous: true,
        child: Box({ className: "sidebar-module-colorpicker-hue-cursor" }),
        setup: self =>
            self.hook(selectedColor, () => self.setCss(`margin-top: ${(13.636 * selectedColor.hue) / 360}rem;`)),
    });
    const hueSelector = Box({
        child: EventBox({
            child: Overlay({ child: hueRange, overlays: [hueSlider] }),
            attribute: {
                clicked: false,
                setHue: event => {
                    const widgetHeight = hueRange.children[0].get_allocated_height();
                    const [, , cursorY] = event.get_coords();
                    const cursorYPercent = clamp(cursorY / widgetHeight, 0, 1);
                    selectedColor.hue = Math.round(cursorYPercent * 360);
                },
            },
            setup: self =>
                self
                    .on("motion-notify-event", (self, event) => {
                        if (!self.attribute.clicked) return;
                        self.attribute.setHue(event);
                    })
                    .on("button-press-event", (self, event) => {
                        if (event.get_button()[1] !== 1) return; // We're only interested in left-click here
                        self.attribute.clicked = true;
                        self.attribute.setHue(event);
                    })
                    .on("button-release-event", self => (self.attribute.clicked = false)),
        }),
    });
    const saturationAndLightnessRange = Box({
        homogeneous: true,
        child: Box({
            className: "sidebar-module-colorpicker-saturationandlightness",
            attribute: {
                update: self => {
                    self.setCss(`
                        background:
                            linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,1)),
                            linear-gradient(to right, #ffffff, ${hslToHex(selectedColor.hue, 100, 50)});
                        `);
                },
            },
            setup: self =>
                self
                    .hook(selectedColor, self.attribute.update, "hue")
                    .hook(selectedColor, self.attribute.update, "assigned"),
        }),
    });
    const saturationAndLightnessCursor = Box({
        className: "sidebar-module-colorpicker-saturationandlightness-cursorwrapper",
        child: Box({
            vpack: "start",
            hpack: "start",
            homogeneous: true,
            css: `
                margin-left: ${(13.636 * selectedColor.xAxis) / 100}rem;
                margin-top: ${(13.636 * (100 - selectedColor.yAxis)) / 100}rem;
            `, // Why 13.636rem? see class name in stylesheet
            attribute: {
                update: self => {
                    self.setCss(`
                        margin-left: ${(13.636 * selectedColor.xAxis) / 100}rem;
                        margin-top: ${(13.636 * (100 - selectedColor.yAxis)) / 100}rem;
                    `); // Why 13.636rem? see class name in stylesheet
                },
            },
            setup: self =>
                self
                    .hook(selectedColor, self.attribute.update, "sl")
                    .hook(selectedColor, self.attribute.update, "assigned"),
            child: Box({
                className: "sidebar-module-colorpicker-saturationandlightness-cursor",
                css: `
                    background-color: ${hslToHex(
                        selectedColor.hue,
                        selectedColor.xAxis,
                        selectedColor.yAxis / (1 + selectedColor.xAxis / 100)
                    )};
                    border-color: ${shouldUseBlackColor() ? colorBlack : colorWhite};
                `,
                attribute: {
                    update: self => {
                        self.setCss(`
                            background-color: ${hslToHex(
                                selectedColor.hue,
                                selectedColor.xAxis,
                                selectedColor.yAxis / (1 + selectedColor.xAxis / 100)
                            )};
                            border-color: ${shouldUseBlackColor() ? colorBlack : colorWhite};
                        `);
                    },
                },
                setup: self =>
                    self
                        .hook(selectedColor, self.attribute.update, "sl")
                        .hook(selectedColor, self.attribute.update, "hue")
                        .hook(selectedColor, self.attribute.update, "assigned"),
            }),
        }),
    });
    const saturationAndLightnessSelector = Box({
        homogeneous: true,
        className: "sidebar-module-colorpicker-saturationandlightness-wrapper",
        child: EventBox({
            child: Overlay({
                child: saturationAndLightnessRange,
                overlays: [saturationAndLightnessCursor],
            }),
            attribute: {
                clicked: false,
                setSaturationAndLightness: event => {
                    const allocation = saturationAndLightnessRange.children[0].get_allocation();
                    const [, cursorX, cursorY] = event.get_coords();
                    const cursorXPercent = clamp(cursorX / allocation.width, 0, 1);
                    const cursorYPercent = clamp(cursorY / allocation.height, 0, 1);
                    selectedColor.xAxis = Math.round(cursorXPercent * 100);
                    selectedColor.yAxis = Math.round(100 - cursorYPercent * 100);
                },
            },
            setup: self =>
                self
                    .on("motion-notify-event", (self, event) => {
                        if (!self.attribute.clicked) return;
                        self.attribute.setSaturationAndLightness(event);
                    })
                    .on("button-press-event", (self, event) => {
                        if (!(event.get_button()[1] === 1)) return; // We're only interested in left-click here
                        self.attribute.clicked = true;
                        self.attribute.setSaturationAndLightness(event);
                    })
                    .on("button-release-event", self => (self.attribute.clicked = false)),
        }),
    });
    const resultColorBox = Box({
        className: "sidebar-module-colorpicker-result-box",
        homogeneous: true,
        css: `background-color: ${hslToHex(
            selectedColor.hue,
            selectedColor.xAxis,
            selectedColor.yAxis / (1 + selectedColor.xAxis / 100)
        )};`,
        child: Label({ className: "txt txt-small", label: "Result" }),
        attribute: {
            update: self => {
                self.setCss(
                    `background-color: ${hslToHex(
                        selectedColor.hue,
                        selectedColor.xAxis,
                        selectedColor.yAxis / (1 + selectedColor.xAxis / 100)
                    )};`
                );
                self.children[0].setCss(`color: ${shouldUseBlackColor() ? colorBlack : colorWhite};`);
            },
        },
        setup: self =>
            self
                .hook(selectedColor, self.attribute.update, "sl")
                .hook(selectedColor, self.attribute.update, "hue")
                .hook(selectedColor, self.attribute.update, "assigned"),
    });
    const ResultBox = ({ colorSystemName, transformResult }) =>
        Box({
            children: [
                Box({
                    vertical: true,
                    hexpand: true,
                    children: [
                        Label({
                            xalign: 0,
                            className: "txt-tiny",
                            label: colorSystemName,
                        }),
                        Overlay({
                            child: Entry({
                                widthChars: 10,
                                className: "txt-small techfont",
                                attribute: {
                                    id: 0,
                                    update: (self, id) => {
                                        if (id && self.attribute.id === id) return;
                                        self.text = transformResult();
                                    },
                                },
                                setup: self =>
                                    self
                                        .hook(selectedColor, self.attribute.update, "sl")
                                        .hook(selectedColor, self.attribute.update, "hue")
                                        .hook(selectedColor, self.attribute.update, "assigned"),
                            }),
                        }),
                    ],
                }),
                Button({
                    child: MaterialIcon("content_copy", "norm"),
                    onClicked: self => {
                        execAsync(["wl-copy", "--", transformResult()]);
                        self.child.label = "done";
                        Utils.timeout(1000, () => (self.child.label = "content_copy"));
                    },
                    setup: setupCursorHover,
                }),
            ],
        });
    const resultHex = ResultBox({
        colorSystemName: "Hex",
        transformResult: () =>
            hslToHex(selectedColor.hue, selectedColor.xAxis, selectedColor.yAxis / (1 + selectedColor.xAxis / 100)),
    });
    const resultRgb = ResultBox({
        colorSystemName: "RGB",
        transformResult: () =>
            hslToRgbValues(
                selectedColor.hue,
                selectedColor.xAxis,
                selectedColor.yAxis / (1 + selectedColor.xAxis / 100)
            ),
    });
    const resultHsl = ResultBox({
        colorSystemName: "HSL",
        transformResult: () =>
            `${selectedColor.hue}, ${selectedColor.xAxis}%, ${Math.round(
                selectedColor.yAxis / (1 + selectedColor.xAxis / 100)
            )}%`,
    });
    const result = Box({
        className: "sidebar-module-colorpicker-result-area spacing-v-5 txt",
        hexpand: true,
        vertical: true,
        children: [resultColorBox, resultHex, resultRgb, resultHsl],
    });
    return SidebarModule({
        icon: MaterialIcon("colorize", "norm"),
        name: "Colour picker",
        revealChild: false,
        child: Box({
            className: "spacing-h-5",
            children: [hueSelector, saturationAndLightnessSelector, result],
        }),
    });
};
