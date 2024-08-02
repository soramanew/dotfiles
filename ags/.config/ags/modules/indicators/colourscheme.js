const { Box, EventBox, Revealer, Button, Label } = Widget;
const { exec, execAsync } = Utils;
import { ConfigToggle, ConfigMultipleSelection } from "../.commonwidgets/configwidgets.js";
import { setupCursorHover } from "../.widgetutils/cursorhover.js";
import { showColorScheme } from "../../variables.js";
import { MaterialIcon } from "../.commonwidgets/materialicon.js";
import { darkMode } from "../.miscutils/system.js";
import { CACHE_DIR } from "../../constants.js";

const ColourBox = ({ name = "Colour", ...rest }) => Box({ ...rest, homogeneous: true, child: Label(name) });

const ColourSchemeSettingsRevealer = () => {
    const headerButtonIcon = MaterialIcon("expand_more", "norm");
    const header = Button({
        className: "osd-settings-btn-arrow",
        onClicked: () => {
            content.revealChild = !content.revealChild;
            headerButtonIcon.label = content.revealChild ? "expand_less" : "expand_more";
        },
        setup: setupCursorHover,
        hpack: "end",
        child: headerButtonIcon,
    });
    const content = Revealer({
        revealChild: false,
        transition: "slide_down",
        transitionDuration: 200,
        child: ColourSchemeSettings(),
        setup: self =>
            self.hook(isHoveredColourschemeSettings, self => {
                if (isHoveredColourschemeSettings.value == false) {
                    Utils.timeout(375, () => {
                        if (isHoveredColourschemeSettings.value == false) self.revealChild = false;
                        headerButtonIcon.label = "expand_more";
                    });
                }
            }),
    });
    return Box({ vertical: true, children: [header, content] });
};

function calculateSchemeInitIndex(optionsArr, searchValue = "vibrant") {
    if (searchValue == "") searchValue = "vibrant";
    const flatArray = optionsArr.flatMap(subArray => subArray);
    const result = flatArray.findIndex(element => element.value === searchValue);
    const rowIndex = Math.floor(result / optionsArr[0].length);
    const columnIndex = result % optionsArr[0].length;
    return [rowIndex, columnIndex];
}

const schemeOptionsArr = [
    [
        { name: "Tonal Spot", value: "tonalspot" },
        { name: "Fruit Salad", value: "fruitsalad" },
        { name: "Fidelity", value: "fidelity" },
        { name: "Rainbow", value: "rainbow" },
    ],
    [
        { name: "Neutral", value: "neutral" },
        { name: "Monochrome", value: "monochrome" },
        { name: "Expressive", value: "expressive" },
        { name: "Vibrant", value: "vibrant" },
    ],
    [{ name: "Vibrant+", value: "morevibrant" }],
];

const LIGHTDARK_FILE_LOCATION = `${CACHE_DIR}/user/colormode.txt`;
const initScheme = exec(`bash -c "sed -n \'3p\' ${LIGHTDARK_FILE_LOCATION}"`);
const initSchemeIndex = calculateSchemeInitIndex(schemeOptionsArr, initScheme);

const ColourSchemeSettings = () =>
    Box({
        className: "osd-colorscheme-settings spacing-v-5",
        vertical: true,
        vpack: "center",
        children: [
            Box({
                vertical: true,
                children: [
                    Label({
                        xalign: 0,
                        className: "txt-norm titlefont txt",
                        label: "Options",
                        hpack: "center",
                    }),
                    //////////////////
                    ConfigToggle({
                        icon: "dark_mode",
                        name: "Dark Mode",
                        desc: "Ya should go to sleep!",
                        initValue: darkMode.value,
                        onChange: (_, newValue) => (darkMode.value = !!newValue),
                        extraSetup: self => self.hook(darkMode, self => (self.enabled.value = darkMode.value)),
                    }),
                ],
            }),
            Box({
                vertical: true,
                className: "spacing-v-5",
                children: [
                    Label({
                        xalign: 0,
                        className: "txt-norm titlefont txt margin-top-5",
                        label: "Scheme styles",
                        hpack: "center",
                    }),
                    //////////////////
                    ConfigMultipleSelection({
                        hpack: "center",
                        vpack: "center",
                        optionsArr: schemeOptionsArr,
                        initIndex: initSchemeIndex,
                        onChange: value => {
                            execAsync([
                                "bash",
                                "-c",
                                `mkdir -p ${CACHE_DIR}/user && sed -i "3s/.*/${value}/" ${CACHE_DIR}/user/colormode.txt`,
                            ])
                                .then(() =>
                                    execAsync([
                                        "bash",
                                        "-c",
                                        `${App.configDir}/scripts/color_generation/switchcolor.sh`,
                                    ]).catch(print)
                                )
                                .catch(print);
                        },
                    }),
                ],
            }),
        ],
    });

const ColourschemeContent = () =>
    Box({
        className: "osd-colorscheme spacing-v-5",
        vertical: true,
        children: [
            Label({
                xalign: 0,
                className: "txt-norm titlefont txt",
                label: "Colour scheme",
                hpack: "center",
            }),
            Box({
                className: "spacing-h-5",
                hpack: "center",
                children: [
                    ColourBox({ name: "P", className: "osd-color osd-color-primary" }),
                    ColourBox({ name: "S", className: "osd-color osd-color-secondary" }),
                    ColourBox({ name: "T", className: "osd-color osd-color-tertiary" }),
                    ColourBox({ name: "Sf", className: "osd-color osd-color-surface" }),
                    ColourBox({ name: "Sf-i", className: "osd-color osd-color-inverseSurface" }),
                    ColourBox({ name: "E", className: "osd-color osd-color-error" }),
                ],
            }),
            Box({
                className: "spacing-h-5",
                hpack: "center",
                children: [
                    ColourBox({ name: "P-c", className: "osd-color osd-color-primaryContainer" }),
                    ColourBox({ name: "S-c", className: "osd-color osd-color-secondaryContainer" }),
                    ColourBox({ name: "T-c", className: "osd-color osd-color-tertiaryContainer" }),
                    ColourBox({ name: "Sf-c", className: "osd-color osd-color-surfaceContainer" }),
                    ColourBox({ name: "Sf-v", className: "osd-color osd-color-surfaceVariant" }),
                    ColourBox({ name: "E-c", className: "osd-color osd-color-errorContainer" }),
                ],
            }),
            ColourSchemeSettingsRevealer(),
        ],
    });

const isHoveredColourschemeSettings = Variable(false);

export default () =>
    Revealer({
        transition: "slide_down",
        transitionDuration: 200,
        child: EventBox({
            hpack: "center",
            onHover: () => isHoveredColourschemeSettings.setValue(true),
            onHoverLost: () => isHoveredColourschemeSettings.setValue(false),
            child: ColourschemeContent(),
        }),
        setup: self => {
            self.hook(showColorScheme, self => {
                if (showColorScheme.value == true) self.revealChild = true;
                else self.revealChild = isHoveredColourschemeSettings.value;
            }).hook(isHoveredColourschemeSettings, self => {
                if (isHoveredColourschemeSettings.value == false) {
                    Utils.timeout(500, () => {
                        if (isHoveredColourschemeSettings.value == false) self.revealChild = showColorScheme.value;
                    });
                }
            });
        },
    });
