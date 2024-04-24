const { Box, Revealer, Label, Button, Icon } = Widget;
import { setupCursorHover } from "../.widgetutils/cursorhover.js";

const ActionText = text =>
    Revealer({
        revealChild: false,
        transition: "crossfade",
        transitionDuration: 200,
        child: Label({
            className: "overview-search-results-txt txt txt-small txt-action",
            label: text,
        }),
    });

const ActionTextRevealer = actionText =>
    Revealer({
        revealChild: false,
        transition: "slide_left",
        transitionDuration: 300,
        child: actionText,
    });

const SearchItem = ({ actionName, onActivate, children, extraClassName, ...rest }) => {
    const actionText = ActionText(actionName);
    const actionTextRevealer = ActionTextRevealer(actionText);
    return Button({
        ...rest,
        className: `overview-search-result-btn txt ${extraClassName}`,
        onClicked: onActivate,
        child: Box({ children: [...children, Box({ hexpand: true }), actionTextRevealer] }),
        setup: setupCursorHover,
    })
        .on("enter-notify-event", () => {
            actionText.revealChild = true;
            actionTextRevealer.revealChild = true;
        })
        .on("leave-notify-event", () => {
            actionText.revealChild = false;
            actionTextRevealer.revealChild = false;
        })
        .on("focus-in-event", () => {
            actionText.revealChild = true;
            actionTextRevealer.revealChild = true;
        })
        .on("focus-out-event", () => {
            actionText.revealChild = false;
            actionTextRevealer.revealChild = false;
        });
};

export const SearchItemIcon = ({ iconName, name, actionName, onActivate, extraClassName = "", ...rest }) =>
    SearchItem({
        ...rest,
        actionName,
        onActivate,
        extraClassName,
        children: [
            Box({
                className: "overview-search-results-icon",
                homogeneous: true,
                child: Icon({ icon: iconName }),
            }),
            Label({
                className: "overview-search-results-txt txt txt-norm",
                label: name,
            }),
        ],
    });

export const SearchItemMaterial = ({
    materialIconName,
    name,
    actionName,
    content,
    onActivate,
    extraClassName = "",
    ...rest
}) =>
    SearchItem({
        ...rest,
        actionName,
        onActivate,
        extraClassName,
        children: [
            Label({
                className: "icon-material overview-search-results-icon",
                label: materialIconName,
            }),
            Box({
                vertical: true,
                children: [
                    Label({
                        hpack: "start",
                        className: "overview-search-results-txt txt-smallie txt-subtext",
                        label: name,
                        truncate: "end",
                    }),
                    Label({
                        hpack: "start",
                        className: "overview-search-results-txt txt-norm",
                        label: content,
                        truncate: "end",
                    }),
                ],
            }),
        ],
    });
