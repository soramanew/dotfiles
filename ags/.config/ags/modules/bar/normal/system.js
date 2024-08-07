// This is for the right pills of the bar.
import GLib from "gi://GLib";
const { Box, Button, Label, EventBox, Revealer, Overlay, Icon } = Widget;
const { execAsync, exec, readFile, writeFile } = Utils;
const Battery = await Service.import("battery");
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import { AnimatedCircProg } from "../../.commonwidgets/cairo_circularprogress.js";
import { WWO_CODE, WEATHER_SYMBOL } from "../../.commondata/weather.js";
import { BarGroup } from "./main.js";
import { BATTERY_LOW, CACHE_DIR, EXTENDED_BAR } from "../../../constants.js";
import { showClock } from "../../../variables.js";

const WEATHER_CACHE_FOLDER = `${CACHE_DIR}/weather`;
exec(`mkdir -p "${WEATHER_CACHE_FOLDER}"`);

const BarGroupSystem = child => BarGroup(child, "system");

const BarClock = () => {
    const getTime = format => GLib.DateTime.new_now_local().format(format);
    const time = Variable("", { poll: [5000, () => getTime("%H:%M")] });
    const date = Variable("", { poll: [60000, () => getTime("%A, %d/%m")] });
    return EventBox({
        onPrimaryClick: () => (showClock.value = !showClock.value),
        child: Box({
            vpack: "center",
            className: "spacing-h-4 bar-clock-box",
            children: [
                Label({
                    className: "bar-time",
                    label: time.bind(),
                }),
                Label({
                    className: "txt-norm txt-onLayer1",
                    label: "•",
                }),
                Label({
                    className: "txt-smallie bar-date",
                    label: date.bind(),
                }),
            ],
        }),
    });
};

const UtilButton = ({ name, icon, onClicked }) =>
    Button({
        vpack: "center",
        tooltipText: name,
        onClicked: onClicked,
        className: "bar-util-btn icon-material txt-norm",
        label: icon,
    });

const Utilities = () =>
    Box({
        hpack: "center",
        className: "spacing-h-4",
        children: [
            UtilButton({
                name: "Screen snip",
                icon: "screenshot_region",
                onClicked: () => execAsync(["bash", "-c", "grimblast --freeze save area - | swappy -f -"]).catch(print),
            }),
            UtilButton({
                name: "Colour picker",
                icon: "colorize",
                onClicked: () => execAsync(["hyprpicker", "-a"]).catch(print),
            }),
            UtilButton({
                name: "Toggle on-screen keyboard",
                icon: "keyboard",
                onClicked: () => App.toggleWindow("osk"),
            }),
        ],
    });

const WeatherModule = () =>
    Box({
        hexpand: true,
        hpack: "center",
        className: "spacing-h-4 txt-onSurfaceVariant",
        children: [
            MaterialIcon("device_thermostat", "small"),
            Label({ className: "txt-smallie", label: "Weather  •" }),
            MaterialIcon("device_thermostat", "small"),
            Label({ className: "txt-smallie", label: "More weather" }),
        ],
        setup: self =>
            self.poll(900000, self => {
                const WEATHER_CACHE_PATH = WEATHER_CACHE_FOLDER + "/wttr.in.txt";
                const updateWeather = weather => {
                    const weatherCode = weather.weatherCode;
                    const weatherDesc = weather.weatherDesc[0].value;
                    const temperature = weather.temp_C;
                    const feelsLike = weather.FeelsLikeC;
                    const uvIndex = weather.uvIndex;
                    const weatherSymbol = WEATHER_SYMBOL[WWO_CODE[weatherCode]];
                    self.children[0].label = weatherSymbol;
                    self.children[1].label = `${temperature}℃ • Feels like ${feelsLike}℃   | `;
                    self.children[2].label =
                        uvIndex > 9
                            ? "brightness_alert"
                            : uvIndex > 6
                            ? "brightness_high"
                            : uvIndex > 3
                            ? "brightness_medium"
                            : "brightness_4";
                    self.children[3].label = `UV ${uvIndex} • ${weatherDesc}`;
                    self.tooltipText = weatherDesc;
                };
                const updateFromCache = () => {
                    try {
                        updateWeather(JSON.parse(readFile(WEATHER_CACHE_PATH)));
                    } catch (err) {
                        print(err);
                    }
                };
                updateFromCache();
                execAsync("curl ipinfo.io")
                    .then(out => JSON.parse(out).city)
                    .then(city =>
                        execAsync(`curl wttr.in/${city.replace(/ /g, "%20")}?format=j1`)
                            .then(out => JSON.parse(out).current_condition[0])
                            .then(weather => {
                                writeFile(JSON.stringify(weather), WEATHER_CACHE_PATH).catch(print);
                                updateWeather(weather);
                            })
                            .catch(err => {
                                print(`Error updating weather. Stderr:\n${err}`);
                                updateFromCache();
                            })
                    )
                    .catch(print);
            }),
    });

const BarBatteryProgress = () =>
    AnimatedCircProg({
        className: "bar-batt-circprog",
        vpack: "center",
        hpack: "center",
        extraSetup: self =>
            self.hook(Battery, circprog => {
                // Set circular progress value
                circprog.css = `font-size: ${Math.abs(Battery.percent)}px;`;

                circprog.toggleClassName("bar-batt-circprog-low", Battery.percent <= BATTERY_LOW);
                circprog.toggleClassName("bar-batt-circprog-full", Battery.charged);
            }),
    });

const BarBattery = () =>
    Box({
        className: "spacing-h-4 bar-batt-txt",
        children: [
            Revealer({
                transitionDuration: 150,
                revealChild: Utils.merge(
                    [Battery.bind("charging"), Battery.bind("charged")],
                    (charging, charged) => charging || charged
                ),
                transition: "slide_right",
                child: MaterialIcon("bolt", "norm", { tooltipText: "Charging" }),
            }),
            Label({
                className: "txt-smallie",
                label: Battery.bind("percent").as(p => p + "%"),
                tooltipText: Utils.merge(
                    [Battery.bind("time_remaining"), Battery.bind("charging"), Battery.bind("charged")],
                    (seconds, charging, charged) => {
                        if (charged) return "Fully charged and STILL charging: INFINITE BATTERY LIFE!!";

                        let timeStr = `${seconds % 60} seconds`;
                        let and = true;
                        const addTime = (time, unit) => {
                            timeStr = `${time} ${unit + (time > 1 ? "s" : "")}${and ? " and" : ""} ${timeStr}`;
                            and = false;
                        };

                        const minutes = Math.floor((seconds % 3600) / 60);
                        if (minutes > 0) addTime(minutes, "min", true);

                        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
                        if (hours > 0) addTime(hours, "hr");

                        const days = Math.floor(seconds / (3600 * 24));
                        if (days > 0) addTime(days, "day");

                        return (charging ? "Time until charged: " : "Battery life: ") + timeStr;
                    }
                ),
            }),
            Overlay({
                child: Box({
                    vpack: "center",
                    className: "bar-batt",
                    homogeneous: true,
                    child: Icon({ className: "txt-smaller", icon: Battery.bind("icon_name") }),
                    setup: self =>
                        self.hook(Battery, box => {
                            box.toggleClassName("bar-batt-low", Battery.percent <= BATTERY_LOW);
                            box.toggleClassName("bar-batt-full", Battery.charged);
                        }),
                }),
                overlays: [BarBatteryProgress()],
            }),
        ],
    });

export default () =>
    Box({
        className: "bar-sidemodule",
        children: [
            BarGroupSystem(BarClock()),
            BarGroupSystem(Utilities()),
            EXTENDED_BAR ? BarGroupSystem(WeatherModule()) : null,
            Battery.available ? BarGroupSystem(BarBattery()) : null,
        ],
    });
