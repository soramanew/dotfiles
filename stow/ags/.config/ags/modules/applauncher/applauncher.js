const { Box, FlowBox, Button, Label, Entry, Icon, Stack, Scrollable } = Widget;
const Applications = await Service.import("applications");
import { SCREEN_HEIGHT } from "../../constants.js";
import { MaterialIcon } from "../.commonwidgets/materialicon.js";

const MAX_HEIGHT = SCREEN_HEIGHT * 0.8;

export const close = launcher => {
    App.closeWindow("applauncher");
    if (launcher.attribute.openedOsk) {
        App.closeWindow("osk");
        launcher.attribute.openedOsk = false;
    }
};

export default () => {
    const AppItem = app =>
        Button({
            className: "applauncher-app",
            attribute: { app },
            onClicked: () => {
                close(widget);
                app.launch();
            },
            child: Box({
                vertical: true,
                tooltipText: app.name + (app.description ? ` | ${app.description}` : ""),
                children: [
                    Icon({ className: "applauncher-appicon", icon: app.iconName }),
                    Label({ label: app.name, truncate: "end" }),
                ],
            }),
        });
    const appList = FlowBox({
        homogeneous: true,
        setup: self =>
            Applications.query("")
                .map(AppItem)
                .forEach(app => self.add(app)),
    });
    const appListScrollable = Scrollable({
        hscroll: "never",
        vscroll: "automatic",
        className: "applauncher-applist",
        child: appList,
    });
    const appListStack = Stack({
        transition: "crossfade",
        transitionDuration: 150,
        children: {
            list: Box({
                vpack: "start",
                vertical: true,
                css: `min-height: ${MAX_HEIGHT}px;`,
                child: appListScrollable,
            }),
            empty: Box({
                vpack: "center",
                vertical: true,
                className: "spacing-v-5 txt-subtext",
                children: [
                    MaterialIcon("apps_outage", "gigantic"),
                    Label({
                        className: "txt-hugeass",
                        label: "No apps... Maybe try a different search?",
                    }),
                ],
            }),
        },
    });
    const widget = Box({
        vertical: true,
        attribute: { openedOsk: false },
        children: [
            Entry({
                className: "applauncher-search",
                placeholderText: "Search for apps",
                attribute: {
                    update: text => {
                        const apps = Applications.query(text);
                        if (apps.length > 0) {
                            appList.set_filter_func(child => apps.includes(child.child.attribute.app));
                            appListStack.shown = "list";
                            let height = appList.get_preferred_height_for_width(appList.get_allocated_width())[0];
                            if (height > MAX_HEIGHT) height = MAX_HEIGHT;
                            appListScrollable.css = `min-height: ${height}px;`;
                        } else appListStack.shown = "empty";
                    },
                },
                onChange: self => self.attribute.update(self.text),
                setup: self =>
                    self
                        .hook(
                            App,
                            (self, name, visible) => {
                                if (name === "applauncher") {
                                    if (visible) self.attribute.update(self.text);
                                    else self.text = "";
                                }
                            },
                            "window-toggled"
                        )
                        .on("button-press-event", (_, event) => {
                            if (event.get_button()[1] === 1) {
                                App.closeWindow("osk");
                                App.openWindow("osk");
                                widget.attribute.openedOsk = true;
                            }
                        }),
            }),
            appListStack,
        ],
    });
    return widget;
};
