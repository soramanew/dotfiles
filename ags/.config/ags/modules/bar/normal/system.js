// This is for the right pills of the bar.
import GLib from "gi://GLib";
const { Box, Label, Button, Icon, Overlay, Revealer } = Widget;
const { execAsync, exec } = Utils;
const Battery = await Service.import("battery");
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import { AnimatedCircProg } from "../../.commonwidgets/cairo_circularprogress.js";
import { WWO_CODE, WEATHER_SYMBOL } from "../../.commondata/weather.js";
import { BarGroup } from "./main.js";
import { BATTERY_LOW, CACHE_DIR } from "../../../constants.js";

const WEATHER_CACHE_FOLDER = `${CACHE_DIR}/weather`;
exec(`mkdir -p "${WEATHER_CACHE_FOLDER}"`);

const BarGroupSystem = child => BarGroup(child, "system");

const BatBatteryProgress = () =>
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

const BarClock = () => {
    const getTime = format => GLib.DateTime.new_now_local().format(format);
    return Box({
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
                name: "Color picker",
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
                    children: [Icon({ className: "txt-smaller", icon: Battery.bind("icon_name") })],
                    setup: self =>
                        self.hook(Battery, box => {
                            box.toggleClassName("bar-batt-low", Battery.percent <= BATTERY_LOW);
                            box.toggleClassName("bar-batt-full", Battery.charged);
                        }),
                    // children: [MaterialIcon("battery_change", "small")],
                    // setup: self =>
                    //     self.hook(Battery, box => {
                    //         box.toggleClassName("bar-batt-low", Battery.percent <= BATTERY_LOW);
                    //         box.toggleClassName("bar-batt-full", Battery.charged);

                    //         const changeIcon = (charging, not) =>
                    //             (box.children[0].label = Battery.charging ? charging : not);

                    //         if (Battery.percent <= 10) changeIcon("battery_charging_full", "battery_alert");
                    //         else if (Battery.percent <= 20) changeIcon("battery_charging_20", "battery_1_bar");
                    //         else if (Battery.percent <= 30) changeIcon("battery_charging_30", "battery_2_bar");
                    //         else if (Battery.percent <= 50) changeIcon("battery_charging_50", "battery_3_bar");
                    //         else if (Battery.percent <= 60) changeIcon("battery_charging_60", "battery_4_bar");
                    //         else if (Battery.percent <= 80) changeIcon("battery_charging_80", "battery_5_bar");
                    //         else if (Battery.percent <= 90) changeIcon("battery_charging_90", "battery_6_bar");
                    //         else changeIcon("battery_full", "battery_full");
                    //     }),
                }),
                overlays: [BatBatteryProgress()],
            }),
        ],
    });

const WeatherModule = () =>
    Box({
        hexpand: true,
        hpack: "center",
        className: "spacing-h-4 txt-onSurfaceVariant",
        children: [MaterialIcon("device_thermostat", "small"), Label({ label: "Weather" })],
        setup: self =>
            self.poll(900000, self => {
                const WEATHER_CACHE_PATH = WEATHER_CACHE_FOLDER + "/wttr.in.txt";
                const updateWeatherForCity = city =>
                    execAsync(`curl https://wttr.in/${city.replace(/ /g, "%20")}?format=j1`)
                        .then(output => {
                            const weather = JSON.parse(output);
                            Utils.writeFile(JSON.stringify(weather), WEATHER_CACHE_PATH).catch(print);
                            const weatherCode = weather.current_condition[0].weatherCode;
                            const weatherDesc = weather.current_condition[0].weatherDesc[0].value;
                            const temperature = weather.current_condition[0].temp_C;
                            const feelsLike = weather.current_condition[0].FeelsLikeC;
                            const weatherSymbol = WEATHER_SYMBOL[WWO_CODE[weatherCode]];
                            self.children[0].label = weatherSymbol;
                            self.children[1].label = `${temperature}℃ • Feels like ${feelsLike}℃`;
                            self.tooltipText = weatherDesc;
                        })
                        .catch(err => {
                            print(`Error updating weather for ${city}. Stderr:\n${err}`);
                            try {
                                // Read from cache
                                const weather = JSON.parse(Utils.readFile(WEATHER_CACHE_PATH));
                                const weatherCode = weather.current_condition[0].weatherCode;
                                const weatherDesc = weather.current_condition[0].weatherDesc[0].value;
                                const temperature = weather.current_condition[0].temp_C;
                                const feelsLike = weather.current_condition[0].FeelsLikeC;
                                const weatherSymbol = WEATHER_SYMBOL[WWO_CODE[weatherCode]];
                                self.children[0].label = weatherSymbol;
                                self.children[1].label = `${temperature}℃ • Feels like ${feelsLike}℃`;
                                self.tooltipText = weatherDesc;
                            } catch (err) {
                                print(err);
                            }
                        });
                execAsync("curl ipinfo.io")
                    .then(output => JSON.parse(output).city.toLowerCase())
                    .then(updateWeatherForCity)
                    .catch(print);
            }),
    });

const VariableModule = () =>
    Battery.available ? [BarGroupSystem(Utilities()), BarGroupSystem(BarBattery())] : [BarGroupSystem(WeatherModule())];

export default () => Box({ className: "bar-sidemodule", children: [BarGroupSystem(BarClock()), ...VariableModule()] });
