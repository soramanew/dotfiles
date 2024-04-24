import Gdk from "gi://Gdk";
import GdkPixbuf from "gi://GdkPixbuf";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Gtk from "gi://Gtk";
const { Box, Button, Label, Overlay, Revealer, Scrollable, Stack } = Widget;
const { execAsync } = Utils;
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import { MarginRevealer } from "../../.widgethacks/advancedrevealers.js";
import { setupCursorHover, setupCursorHoverInfo } from "../../.widgetutils/cursorhover.js";
import DuckService from "../../../services/ducks.js";

function getImageViewerApp(preferredApp) {
    execAsync(["bash", "-c", `command -v ${preferredApp}`]).then(output => {
        if (output != "") return preferredApp;
        else return "xdg-open";
    });
}

const IMAGE_REVEAL_DELAY = 13; // Some wait for inits n other weird stuff
const IMAGE_VIEWER_APP = getImageViewerApp("loupe"); // Gnome's image viewer cuz very comfortable zooming
const USER_CACHE_DIR = GLib.get_user_cache_dir();

// Create cache folder and clear pics from previous session
Utils.exec(`bash -c 'mkdir -p ${USER_CACHE_DIR}/ags/media/ducks'`);
Utils.exec(`bash -c 'rm ${USER_CACHE_DIR}/ags/media/ducks/*'`);

export function fileExists(filePath) {
    let file = Gio.File.new_for_path(filePath);
    return file.query_exists(null);
}

const CommandButton = command =>
    Button({
        className: "sidebar-chat-chip sidebar-chat-chip-action txt txt-small",
        onClicked: () => sendMessage(command),
        setup: setupCursorHover,
        label: command,
    });

export const duckTabIcon = Box({
    hpack: "center",
    className: "sidebar-chat-apiswitcher-icon",
    homogeneous: true,
    children: [MaterialIcon("photo_library", "norm")],
});

const DuckImage = () => {
    const ImageState = (icon, name) =>
        Box({
            className: "spacing-h-5 txt",
            children: [
                Box({ hexpand: true }),
                Label({
                    className: "sidebar-duck-txt txt-smallie",
                    xalign: 0,
                    label: name,
                }),
                MaterialIcon(icon, "norm"),
            ],
        });
    const ImageAction = ({ name, icon, action }) =>
        Button({
            className: "sidebar-duck-image-action txt-norm icon-material",
            tooltipText: name,
            label: icon,
            onClicked: action,
            setup: setupCursorHover,
        });
    const colorIndicator = Box({
        className: `sidebar-chat-indicator`,
    });
    const downloadState = Stack({
        homogeneous: false,
        transition: "slide_up_down",
        transitionDuration: 150,
        children: {
            api: ImageState("api", "Calling API"),
            download: ImageState("downloading", "Downloading image"),
            done: ImageState("done", "Finished!"),
            error: ImageState("error", "Error"),
        },
    });
    const downloadIndicator = MarginRevealer({
        vpack: "center",
        transition: "slide_left",
        revealChild: true,
        child: downloadState,
    });
    const blockHeading = Box({
        hpack: "fill",
        className: "sidebar-duck-content spacing-h-5",
        children: [Box({ hexpand: true }), downloadIndicator],
    });
    const blockImageActions = Revealer({
        transition: "crossfade",
        revealChild: false,
        child: Box({
            vertical: true,
            children: [
                Box({
                    className: "sidebar-duck-image-actions spacing-h-3",
                    children: [
                        Box({ hexpand: true }),
                        ImageAction({
                            name: "Go to source",
                            icon: "link",
                            action: () =>
                                execAsync(["xdg-open", `${thisBlock.attribute.imageData.source}`]).catch(print),
                        }),
                        ImageAction({
                            name: "Hoard",
                            icon: "save",
                            action: () =>
                                execAsync([
                                    "bash",
                                    "-c",
                                    `mkdir -p ~/Pictures/Ducks && cp ${thisBlock.attribute.imagePath} ~/Pictures/Ducks`,
                                ]).catch(print),
                        }),
                        ImageAction({
                            name: "Open externally",
                            icon: "open_in_new",
                            action: () =>
                                execAsync([IMAGE_VIEWER_APP, `${thisBlock.attribute.imagePath}`]).catch(print),
                        }),
                    ],
                }),
            ],
        }),
    });
    const blockImage = Widget.DrawingArea({
        className: "sidebar-duck-image",
    });
    const blockImageRevealer = Revealer({
        transition: "slide_down",
        transitionDuration: 150,
        revealChild: false,
        child: Overlay({
            child: Box({
                homogeneous: true,
                className: "sidebar-duck-image",
                children: [blockImage],
            }),
            overlays: [blockImageActions],
        }),
    });
    const thisBlock = Box({
        className: "sidebar-chat-message",
        attribute: {
            imagePath: "",
            imageData: "",
            update: (imageData, force = false) => {
                thisBlock.attribute.imageData = imageData;
                const { status, signature, url, extension, source, dominant_color, width, height } =
                    thisBlock.attribute.imageData;
                if (status != 200) {
                    downloadState.shown = "error";
                    return;
                }
                thisBlock.attribute.imagePath = `${USER_CACHE_DIR}/ags/media/ducks/${signature}${extension}`;
                downloadState.shown = "download";
                // Width/height
                const widgetWidth = Math.min(Math.floor(duckContent.get_allocated_width() * 0.85), width);
                const widgetHeight = Math.ceil((widgetWidth * height) / width);
                blockImage.set_size_request(widgetWidth, widgetHeight);
                const showImage = () => {
                    downloadState.shown = "done";
                    const pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_size(
                        thisBlock.attribute.imagePath,
                        widgetWidth,
                        widgetHeight
                    );
                    // const pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(thisBlock.attribute.imagePath, widgetWidth, widgetHeight, false);

                    blockImage.set_size_request(widgetWidth, widgetHeight);
                    blockImage.connect("draw", (widget, cr) => {
                        const borderRadius = widget
                            .get_style_context()
                            .get_property("border-radius", Gtk.StateFlags.NORMAL);

                        // Draw a rounded rectangle
                        cr.arc(borderRadius, borderRadius, borderRadius, Math.PI, 1.5 * Math.PI);
                        cr.arc(widgetWidth - borderRadius, borderRadius, borderRadius, 1.5 * Math.PI, 2 * Math.PI);
                        cr.arc(widgetWidth - borderRadius, widgetHeight - borderRadius, borderRadius, 0, 0.5 * Math.PI);
                        cr.arc(borderRadius, widgetHeight - borderRadius, borderRadius, 0.5 * Math.PI, Math.PI);
                        cr.closePath();
                        cr.clip();

                        // Paint image as bg
                        Gdk.cairo_set_source_pixbuf(cr, pixbuf, 0, 0);
                        cr.paint();
                    });

                    // Reveal stuff
                    Utils.timeout(IMAGE_REVEAL_DELAY, () => {
                        blockImageRevealer.revealChild = true;
                    });
                    Utils.timeout(
                        IMAGE_REVEAL_DELAY + blockImageRevealer.transitionDuration,
                        () => (blockImageActions.revealChild = true)
                    );
                    downloadIndicator.attribute.hide();
                };
                // Show
                if (!force && fileExists(thisBlock.attribute.imagePath)) showImage();
                else
                    Utils.execAsync(["bash", "-c", `wget -O '${thisBlock.attribute.imagePath}' '${url}'`])
                        .then(showImage)
                        .catch(print);
                blockHeading.get_children().forEach(child => {
                    child.setCss(`border-color: ${dominant_color};`);
                });
                colorIndicator.css = `background-color: ${dominant_color};`;
            },
        },
        children: [
            colorIndicator,
            Box({
                vertical: true,
                className: "spacing-v-5",
                children: [
                    blockHeading,
                    Box({
                        vertical: true,
                        hpack: "start",
                        children: [blockImageRevealer],
                    }),
                ],
            }),
        ],
    });
    return thisBlock;
};

const DuckInfo = () => {
    const duckLogo = Label({
        hpack: "center",
        className: "sidebar-chat-welcome-logo",
        label: "photo_library",
    });
    return Box({
        vertical: true,
        vexpand: true,
        className: "spacing-v-15",
        children: [
            duckLogo,
            Label({
                className: "txt txt-title-small sidebar-chat-welcome-txt",
                wrap: true,
                justify: Gtk.Justification.CENTER,
                label: "Ducks",
            }),
            Box({
                className: "spacing-h-5",
                hpack: "center",
                children: [
                    Label({
                        className: "txt-smallie txt-subtext",
                        wrap: true,
                        justify: Gtk.Justification.CENTER,
                        label: "Powered by random-d.uk",
                    }),
                    Button({
                        className: "txt-subtext txt-norm icon-material",
                        label: "info",
                        tooltipText: "A random duck API.",
                        setup: setupCursorHoverInfo,
                    }),
                ],
            }),
        ],
    });
};

const duckWelcome = Box({
    vexpand: true,
    homogeneous: true,
    child: Box({
        className: "spacing-v-15",
        vpack: "center",
        vertical: true,
        children: [DuckInfo()],
    }),
});

const duckContent = Box({
    className: "spacing-v-15",
    vertical: true,
    attribute: {
        map: new Map(),
    },
    setup: self =>
        self
            .hook(
                DuckService,
                (box, id) => {
                    if (id === undefined) return;
                    const newImageBlock = DuckImage();
                    box.add(newImageBlock);
                    box.show_all();
                    box.attribute.map.set(id, newImageBlock);
                },
                "newResponse"
            )
            .hook(
                DuckService,
                (box, id) => {
                    if (id === undefined) return;
                    const data = DuckService.responses[id];
                    if (!data) return;
                    const imageBlock = box.attribute.map.get(id);
                    imageBlock?.attribute.update(data);
                },
                "updateResponse"
            ),
});

export const duckView = Scrollable({
    className: "sidebar-chat-viewport",
    vexpand: true,
    child: Box({
        vertical: true,
        children: [duckWelcome, duckContent],
    }),
    setup: scrolledWindow => {
        // Show scrollbar
        scrolledWindow.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);
        const vScrollbar = scrolledWindow.get_vscrollbar();
        vScrollbar.get_style_context().add_class("sidebar-scrollbar");
        // Avoid click-to-scroll-widget-to-view behavior
        Utils.timeout(1, () => {
            const viewport = scrolledWindow.child;
            viewport.set_focus_vadjustment(new Gtk.Adjustment(undefined));
        });
        // Always scroll to bottom with new content
        const adjustment = scrolledWindow.get_vadjustment();
        adjustment.connect("changed", () => {
            adjustment.set_value(adjustment.get_upper() - adjustment.get_page_size());
        });
    },
});

export const duckCommands = Box({
    className: "spacing-h-5",
    setup: self => self.pack_end(CommandButton("/clear"), false, false, 0),
});

const clearChat = () => {
    // destroy!!
    duckContent.attribute.map.forEach((value, key, map) => {
        value.destroy();
        value = null;
    });
};

export const sendMessage = text => {
    // Do something on send
    // Commands
    if (text.startsWith("/clear")) clearChat();
    else DuckService.fetch();
};
