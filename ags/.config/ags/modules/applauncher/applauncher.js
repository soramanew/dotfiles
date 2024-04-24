const { Box, FlowBox, Button, Label, Entry, Icon, Stack } = Widget;
const Applications = await Service.import("applications");
import { SCREEN_HEIGHT } from "../../variables.js";
import { RoundedScrollable } from "../.commonwidgets/cairo_roundedscrollable.js";
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
    const appListScrollable = RoundedScrollable({
        hscroll: "never",
        vscroll: "automatic",
        className: "applauncher-applist",
        overlayClass: "applauncher-scrollcorner",
        child: appList,
        setup: self => {
            const vScrollbar = self.get_vscrollbar();
            vScrollbar.get_style_context().add_class("applauncher-scrollbar");
        },
    });
    const appListStack = Stack({
        transition: "crossfade",
        transitionDuration: 150,
        children: {
            list: appListScrollable,
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
                        const apps = Applications.query(text).map(AppItem);
                        appList.get_children().forEach(child => child.destroy());
                        apps.forEach(app => appList.add(app));
                        appList.show_all();

                        let height = appList.get_preferred_height_for_width(appList.get_allocated_width())[0];
                        if (height > MAX_HEIGHT) height = MAX_HEIGHT;
                        appListScrollable.child.css = `min-height: ${height}px;`;

                        if (apps.length === 0) {
                            appListScrollable.child.css = `min-height: ${MAX_HEIGHT}px;`;
                            appListStack.shown = "empty";
                        } else appListStack.shown = "list";
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
