import Gdk from "gi://Gdk";
const { Box, Label, Revealer, Entry, Scrollable } = Widget;
const { exec } = Utils;
const Applications = await Service.import("applications");
import { hasUnterminatedBackslash, launchCustomCommand, ls, actions, actionsList } from "./miscfunctions.js";
import {
    CalculationResultButton,
    CustomCommandButton,
    DirectoryButton,
    DesktopEntryButton,
    ExecuteCommandButton,
    SearchButton,
} from "./searchbuttons.js";
import { checkKeybind, keybinds } from "../.widgetutils/keybind.js";
import Overview from "./overview_hyprland.js";
import fuzzysort from "./fuzzysort.js";
import mathexprs from "./mathexprs.js";
import { SCREEN_HEIGHT, SEARCH_MAX_RESULTS as MAX_RESULTS } from "../../constants.js";
import { Click2CloseRegion } from "../.commonwidgets/click2closeregion.js";

const MAX_HEIGHT = SCREEN_HEIGHT * 0.7;

const parseExpr = expr => {
    try {
        return mathexprs.fromText(expr);
    } catch (e) {
        // console.log(e);
        return mathexprs.fromLatex(expr);
    }
};

const evalMath = text => {
    const vars = {};
    let expr = text;
    if (text.startsWith("let")) {
        let defs = text.replace("let", "").split(";");
        expr = defs[1];
        defs = defs[0].split(",");
        for (const def of defs) {
            const [name, value] = def.split("=");
            vars[name.trim()] = Number(value);
        }
    } else if (text.startsWith("derive") || text.startsWith("d")) {
        let [dArgs, expr] = (text.startsWith("derive") ? text.replace("derive", "") : text.slice(1)).split(";");
        const respectTo = dArgs.trim()[0];
        const times = Number(dArgs.trim().slice(1)) - 1;
        expr = mathexprs.fromText(expr);
        for (let i = 0; i < times; i++) {
            expr = expr.derivative(respectTo);
        }
        return expr.toString();
    }
    if (expr.includes("=")) {
        const exprs = expr.split("=");
        const results = [];
        for (const expr of exprs) {
            results.push(parseExpr(expr));
        }
        for (const r1 of results) {
            for (const r2 of results) {
                if (r1.evaluate(vars) !== r2.evaluate(vars)) return false;
            }
        }
        return true;
    }
    return parseExpr(expr).evaluate(vars);
};

const C2C = () => Click2CloseRegion({ name: "overview" });

export default () => {
    const overviewContent = Overview();

    let appSearchResults = [];

    const resultsBox = Box({ vertical: true });
    const resultsScrollable = Scrollable({
        hscroll: "never",
        vscroll: "automatic",
        child: resultsBox,
        setup: self => {
            const vScrollbar = self.get_vscrollbar();
            vScrollbar.get_style_context().add_class("overview-results-scrollbar");
        },
    });
    const resultsRevealer = Revealer({
        transitionDuration: 200,
        revealChild: false,
        transition: "slide_down",
        hpack: "center",
        hexpand: false,
        child: Box({ className: "overview-search-results", child: resultsScrollable }),
    });
    const entryPromptRevealer = Revealer({
        transition: "crossfade",
        transitionDuration: 150,
        revealChild: true,
        hpack: "center",
        child: Label({ className: "overview-search-prompt txt-small txt", label: "Type to search" }),
    });

    const entryIconRevealer = Revealer({
        transition: "crossfade",
        transitionDuration: 150,
        revealChild: false,
        hpack: "end",
        child: Label({ className: "txt txt-large icon-material overview-search-icon", label: "search" }),
    });

    const entryIcon = Box({
        className: "overview-search-prompt-box",
        setup: box => box.pack_start(entryIconRevealer, true, true, 0),
    });

    const entry = Entry({
        className: "overview-search-box txt-small txt",
        hpack: "center",
        onAccept: self => {
            // This is when you hit Enter
            const text = self.text;
            if (!text.length) return;
            if (text.startsWith(">todo")) {
                App.closeWindow("overview");
                launchCustomCommand(text);
            } else resultsBox.get_children()[0].attribute.activate();
        },
        onChange: self => {
            // this is when you type
            const text = self.text;

            // check empty if so then dont do stuff
            if (!text.length) {
                resultsRevealer.revealChild = false;
                overviewContent.revealChild = true;
                entryPromptRevealer.revealChild = true;
                entryIconRevealer.revealChild = false;
                self.toggleClassName("overview-search-box-extended", false);
                return;
            }

            const isAction = text.startsWith(">");
            const isDir = ["/", "~"].includes(text[0]);
            resultsBox.get_children().forEach(ch => ch.destroy());

            resultsRevealer.revealChild = true;
            overviewContent.revealChild = false;
            entryPromptRevealer.revealChild = false;
            entryIconRevealer.revealChild = true;
            self.toggleClassName("overview-search-box-extended", true);

            // Calculate
            try {
                resultsBox.add(CalculationResultButton({ result: evalMath(text) }));
            } catch (e) {
                // console.log(e);
            }

            if (isDir) {
                let contents = ls({
                    path: text.endsWith("/") ? text : text.slice(0, text.lastIndexOf("/")),
                    silent: true,
                });
                contents = fuzzysort.go(text.slice(text.lastIndexOf("/") + 1), contents, { key: "name", all: true });
                contents.forEach(({ obj }) => resultsBox.add(DirectoryButton(obj)));
            }

            if (isAction) {
                const contents = fuzzysort.go(text.split(" ")[0].slice(1), actionsList, { all: true });
                contents.forEach(({ target }) => {
                    if (target === "todo") {
                        const onActivate = () => {
                            if (text.split(" ")[0] !== ">todo") self.set_text(">todo ");
                            self.grab_focus();
                            self.set_position(-1);
                        };
                        resultsBox.add(
                            CustomCommandButton({ cmd: `>${target}`, desc: actions[target].desc, onActivate })
                        );
                    } else resultsBox.add(CustomCommandButton({ cmd: `>${target}`, desc: actions[target].desc }));
                });
            }

            // Add application entries
            appSearchResults = Applications.query(text);
            if (appSearchResults.length > MAX_RESULTS) appSearchResults.length = MAX_RESULTS;
            appSearchResults.forEach(app => resultsBox.add(DesktopEntryButton(app)));

            // If the first word is an actual command
            if (
                !isAction &&
                !hasUnterminatedBackslash(text) &&
                exec(`fish -c 'command -v ${text.split(" ")[0]}'`) !== ""
            )
                resultsBox.add(ExecuteCommandButton({ command: self.text, terminal: self.text.startsWith("sudo") }));

            // Search
            resultsBox.add(SearchButton({ text: self.text }));
            resultsBox.show_all();

            // Resize scrollable manually cause it doesn't want to fit content
            let height = resultsBox.get_preferred_height()[0];
            if (height > MAX_HEIGHT) height = MAX_HEIGHT;
            resultsScrollable.css = `min-height: ${height}px; transition: 300ms cubic-bezier(0, 0.55, 0.45, 1);`;
        },
    });
    return Box({
        className: "overview-window",
        vertical: true,
        children: [
            Box({
                vexpand: false,
                children: [
                    C2C(),
                    Box({
                        hpack: "center",
                        children: [
                            entry,
                            Box({
                                className: "overview-search-icon-box",
                                setup: box => box.pack_start(entryPromptRevealer, true, true, 0),
                            }),
                            entryIcon,
                        ],
                    }),
                    C2C(),
                ],
            }),
            overviewContent,
            Box({ vexpand: false, children: [C2C(), resultsRevealer, C2C()] }),
            C2C(),
        ],
        setup: self =>
            self
                .hook(App, (_, name, visible) => {
                    if (name === "overview" && !visible) {
                        resultsBox.children = [];
                        entry.set_text("");
                    }
                })
                .on("key-press-event", (widget, event) => {
                    // Typing
                    const keyval = event.get_keyval()[1];
                    const modstate = event.get_state()[1];
                    if (checkKeybind(event, keybinds.overview.altMoveLeft))
                        entry.set_position(Math.max(entry.get_position() - 1, 0));
                    else if (checkKeybind(event, keybinds.overview.altMoveRight))
                        entry.set_position(Math.min(entry.get_position() + 1, entry.get_text().length));
                    else if (checkKeybind(event, keybinds.overview.deleteToEnd)) {
                        const text = entry.get_text();
                        const pos = entry.get_position();
                        const newText = text.slice(0, pos);
                        entry.set_text(newText);
                        entry.set_position(newText.length);
                    } else if (!(modstate & Gdk.ModifierType.CONTROL_MASK)) {
                        // Ctrl not held
                        if (keyval >= 32 && keyval <= 126 && widget != entry) {
                            Utils.timeout(1, () => entry.grab_focus());
                            entry.set_text(entry.text + String.fromCharCode(keyval));
                            entry.set_position(-1);
                        }
                    }
                }),
    });
};
