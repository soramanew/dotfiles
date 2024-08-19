import Gdk from "gi://Gdk";
const { Box, Label, Button, Entry, Overlay, Menu, MenuItem, Stack } = Widget;
const Greetd = await Service.import("greetd");
import { session } from "./session.js";
import { CACHE_DIR, setupCursorHover } from "../lib.js";

const users = Utils.exec(
    "find /home -maxdepth 1 -mindepth 1 -type d -not -name 'lost+found' -exec basename {} \\;"
).split("\n");
const user = Variable(Utils.readFile(`${CACHE_DIR}/last-user.txt`) || users[0]);

const Face = () =>
    Overlay({
        child: Label({ className: "face-fallback", label: "person" }),
        overlays: [
            Box({
                className: "face",
                css: user.bind().as(u => `background-image: url("${CACHE_DIR}/faces/${u}");`),
            }),
        ],
    });

const Username = () => {
    const name = Label({ label: user.bind() });
    if (users.length <= 1)
        return Box({
            hpack: "center",
            className: "username username-single",
            child: name,
        });

    const menu = Menu({
        children: user
            .bind()
            .as(a =>
                users.filter(u => u !== a).map(u => MenuItem({ child: Label(u), onActivate: () => (user.value = u) }))
            ),
    });

    return Button({
        hpack: "center",
        className: "username",
        child: Box({
            children: [name, Label({ className: "user-picker-icon", label: "keyboard_arrow_down" })],
        }),
        onPrimaryClick: self => menu.popup_at_widget(self, Gdk.Gravity.SOUTH, Gdk.Gravity.NORTH, null),
        setup: self => self.on("destroy", () => menu.destroy()),
        setup: setupCursorHover,
    });
};

export default () => {
    const login = () => {
        Utils.writeFile(user.value, `${CACHE_DIR}/last-user.txt`).catch(print);
        Utils.writeFile(JSON.stringify(session.value), `${CACHE_DIR}/last-session.txt`).catch(print);
        stack.shown = "loading";
        Greetd.login(user.value, password.text, session.value.exec).catch(e => {
            let resp;
            if (e.type === "error") resp = e.error_type === "auth_error" ? "Wrong Password" : e.description;
            else resp = e.auth_message;
            response.child.label = resp || "Error";

            stack.shown = "response";
            response.grab_focus();
        });
    };

    const password = Entry({
        className: "password",
        xalign: 0.5,
        placeholderText: "Enter Password",
        visibility: false,
        onAccept: login,
        setup: self => Utils.timeout(1, () => self.grab_focus()),
    });

    const response = Button({
        child: Label({ className: "password response" }),
        onClicked: () => {
            stack.shown = "password";
            password.grab_focus();
        },
    });

    const stack = Stack({
        transition: "crossfade",
        transitionDuration: 150,
        children: {
            password,
            response,
            loading: Label({ className: "password loading", label: "Loading..." }),
        },
    });

    const loginButton = Button({
        hpack: "center",
        className: "login-button",
        child: Label("east"),
        onClicked: login,
        setup: setupCursorHover,
    });

    return Overlay({
        attribute: password,
        passThrough: true,
        child: Box({ expand: true }),
        overlays: [
            Box({
                vertical: true,
                hpack: "center",
                vpack: "center",
                children: [
                    Box({
                        hexpand: true,
                        vertical: true,
                        className: "auth",
                        children: [Box({ vexpand: true }), Username(), stack],
                    }),
                    loginButton,
                ],
            }),
            Box({
                vertical: true,
                hpack: "center",
                vpack: "center",
                children: [Face(), Box({ className: "face-offset" })],
            }),
        ],
    });
};
