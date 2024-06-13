// This is for the right pills of the bar.
import GLib from "gi://GLib";
const { Box, Button, Label, EventBox } = Widget;
const { execAsync, exec, readFile, writeFile } = Utils;
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import { WWO_CODE, WEATHER_SYMBOL } from "../../.commondata/weather.js";
import { BarGroup } from "./main.js";
import { CACHE_DIR } from "../../../constants.js";
import { showClock } from "../../../variables.js";

const WEATHER_CACHE_FOLDER = `${CACHE_DIR}/weather`;
exec(`mkdir -p "${WEATHER_CACHE_FOLDER}"`);

const BarGroupSystem = child => BarGroup(child, "system");

const BarClock = () => {
    const getTime = format => GLib.DateTime.new_now_local().format(format);
    return EventBox({
        onPrimaryClick: () => (showClock.value = !showClock.value),
        child: Box({
            vpack: "center",
            className: "spacing-h-4 bar-clock-box",
            children: [
                Label({
                    className: "bar-time",
                    label: getTime("%H:%M"),
                    setup: self => self.poll(5000, self => (self.label = getTime("%H:%M"))),
                }),
                Label({
                    className: "txt-norm txt-onLayer1",
                    label: "•",
                }),
                Label({
                    className: "txt-smallie bar-date",
                    label: getTime("%A, %d/%m"),
                    setup: self => self.poll(60000, self => (self.label = getTime("%A, %d/%m"))),
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
                execAsync(`curl https://wttr.in/?format=j1`)
                    .then(output => {
                        const weather = JSON.parse(output).current_condition[0];
                        writeFile(JSON.stringify(weather), WEATHER_CACHE_PATH).catch(print);
                        updateWeather(weather);
                    })
                    .catch(err => {
                        print(`Error updating weather. Stderr:\n${err}`);
                        try {
                            // Read from cache
                            updateWeather(JSON.parse(readFile(WEATHER_CACHE_PATH)));
                        } catch (err) {
                            print(err);
                        }
                    });
            }),
    });

export default () =>
    Box({
        className: "bar-sidemodule",
        children: [BarGroupSystem(BarClock()), BarGroupSystem(Utilities()), BarGroupSystem(WeatherModule())],
    });
