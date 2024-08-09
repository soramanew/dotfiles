import Gdk from "gi://Gdk";
const { Box, Label, Button, Entry, Overlay, Menu, MenuItem, Stack } = Widget;
const Greetd = await Service.import("greetd");
import { session } from "./session.js";
import { CACHE_DIR, setupCursorHover } from "../lib.js";

const users = Utils.exec("find /home -maxdepth 1 -mindepth 1 -type d")
    .split("\n")
    .map(d => d.replace("/home/", ""))
    .filter(u => u !== "lost+found");
const user = Variable(Utils.readFile(`${CACHE_DIR}/last-user.txt`) || users[0]);

const Face = () =>
    Overlay({
        child: Label({ className: "face-fallback", label: "person" }),
        overlays: [
            Box({
                className: "face",
                css: user.bind().as(u => `background-image: url("/home/${u}/.face");`),
            }),
        ],
    });

const Username = () => {
    const name = Label({ label: user.bind() });
    if (users.length <= 1)
        return Box({
            hpack: "center",
            className: "username",
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
        child: name,
        onPrimaryClick: self => menu.popup_at_widget(self, Gdk.Gravity.SOUTH, Gdk.Gravity.NORTH, null),
        setup: self => self.on("destroy", () => menu.destroy()),
        setup: setupCursorHover,
    });
};

export default () => {
    const login = () => {
        Utils.writeFile(user.value, `${CACHE_DIR}/last-user.txt`).catch(print);
        Utils.writeFile(JSON.stringify(session.value), `${CACHE_DIR}/last-session.txt`).catch(print);
        Greetd.login(user.value, password.text, session.value.exec).catch(e => {
            response.child.label = JSON.stringify(e).description;
            passwordOrResponse.shown = "resp";
            response.grab_focus();
        });
    };

    // TODO: fix stack not allowing mouse focus
    const password = Entry({
        className: "password",
        xalign: 0.5,
        placeholderText: "Enter Password",
        visibility: false,
        onAccept: login,
        setup: self => Utils.timeout(1, () => self.grab_focus()),
    });

    const response = Button({
        child: Label({ truncate: "end", className: "password response" }),
        onClicked: () => {
            passwordOrResponse.shown = "pass";
            password.grab_focus();
        },
    });

    const passwordOrResponse = Stack({
        transition: "crossfade",
        transitionDuration: 150,
        children: {
            pass: password,
            resp: response,
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
                        children: [Box({ vexpand: true }), Username(), passwordOrResponse],
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
