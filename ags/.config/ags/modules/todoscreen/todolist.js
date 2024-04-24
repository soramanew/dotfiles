const { Box, EventBox, Button, Label, Revealer, Scrollable, Entry } = Widget;
import { MaterialIcon } from "../.commonwidgets/materialicon.js";
import { TabContainer } from "../.commonwidgets/tabcontainer.js";
import Todo from "../../services/todo.js";
import { setupCursorHover } from "../.widgetutils/cursorhover.js";

const TodoListItem = (task, id, isDone) => {
    const crosser = Box({ className: "sidebar-todo-crosser" });
    const todoContent = Box({
        className: "sidebar-todo-item spacing-h-5",
        children: [
            Label({
                hexpand: true,
                xalign: 0,
                wrap: true,
                className: "txt txt-small sidebar-todo-txt",
                label: task.content,
                selectable: true,
            }),
            Button({
                // Check/Uncheck
                vpack: "center",
                className: "txt sidebar-todo-item-action",
                child: MaterialIcon(isDone ? "remove_done" : "check", "norm", { vpack: "center" }),
                onClicked: () => {
                    const contentWidth = todoContent.get_allocated_width();
                    crosser.toggleClassName("sidebar-todo-crosser-crossed", true);
                    crosser.css = `margin-left: -${contentWidth}px;`;
                    Utils.timeout(200, () => (widgetRevealer.revealChild = false));
                    Utils.timeout(350, () => {
                        if (isDone) Todo.uncheck(id);
                        else Todo.check(id);
                    });
                },
                setup: setupCursorHover,
            }),
            Button({
                // Remove
                vpack: "center",
                className: "txt sidebar-todo-item-action",
                child: MaterialIcon("delete_forever", "norm", { vpack: "center" }),
                onClicked: () => {
                    const contentWidth = todoContent.get_allocated_width();
                    crosser.toggleClassName("sidebar-todo-crosser-removed", true);
                    crosser.css = `margin-left: -${contentWidth}px;`;
                    Utils.timeout(200, () => (widgetRevealer.revealChild = false));
                    Utils.timeout(350, () => Todo.remove(id));
                },
                setup: setupCursorHover,
            }),
            crosser,
        ],
    });
    const highlightOnHover = EventBox({
        onHover: () => todoContent.toggleClassName("sidebar-todo-item-hovered", true),
        onHoverLost: () => todoContent.toggleClassName("sidebar-todo-item-hovered", false),
        child: todoContent,
    });
    const widgetRevealer = Revealer({
        revealChild: true,
        transition: "slide_down",
        transitionDuration: 150,
        child: highlightOnHover,
    });
    return widgetRevealer;
};

const TodoItems = isDone =>
    Scrollable({
        hscroll: "never",
        vscroll: "automatic",
        child: Box({
            vertical: true,
            setup: self =>
                self.hook(
                    Todo,
                    self => {
                        self.children = Todo.todo_json.map((task, i) =>
                            task.done === isDone ? TodoListItem(task, i, isDone) : null
                        );
                        if (self.children.length == 0) {
                            self.homogeneous = true;
                            self.children = [
                                Box({
                                    hexpand: true,
                                    vertical: true,
                                    vpack: "center",
                                    className: "txt",
                                    children: [
                                        MaterialIcon(isDone ? "checklist" : "check_circle", "gigantic"),
                                        Label({ label: isDone ? "Finished tasks will go here" : "Nothing here!" }),
                                    ],
                                }),
                            ];
                        } else self.homogeneous = false;
                    },
                    "updated"
                ),
        }),
        setup: listContents => {
            const vScrollbar = listContents.get_vscrollbar();
            vScrollbar.get_style_context().add_class("sidebar-scrollbar");
        },
    });

const UndoneTodoList = () => {
    const newTaskButton = Revealer({
        transition: "slide_left",
        transitionDuration: 200,
        revealChild: true,
        child: Button({
            className: "txt-small sidebar-todo-new",
            halign: "end",
            vpack: "center",
            label: "+ New task",
            setup: setupCursorHover,
            onClicked: () => {
                newTaskButton.revealChild = false;
                newTaskEntryRevealer.revealChild = true;
                confirmAddTask.revealChild = true;
                cancelAddTask.revealChild = true;
                newTaskEntry.grab_focus();
            },
        }),
    });
    const cancelAddTask = Revealer({
        transition: "slide_right",
        transitionDuration: 200,
        revealChild: false,
        child: Button({
            className: "txt-norm icon-material sidebar-todo-add",
            halign: "end",
            vpack: "center",
            label: "close",
            setup: setupCursorHover,
            onClicked: () => {
                newTaskEntryRevealer.revealChild = false;
                confirmAddTask.revealChild = false;
                cancelAddTask.revealChild = false;
                newTaskButton.revealChild = true;
                newTaskEntry.text = "";
            },
        }),
    });
    const newTaskEntry = Entry({
        // hexpand: true,
        vpack: "center",
        className: "txt-small sidebar-todo-entry",
        placeholderText: "Add a task...",
        onAccept: ({ text }) => {
            if (text == "") return;
            Todo.add(text);
            newTaskEntry.text = "";
        },
        onChange: ({ text }) => confirmAddTask.child.toggleClassName("sidebar-todo-add-available", text != ""),
    });
    const newTaskEntryRevealer = Revealer({
        transition: "slide_right",
        transitionDuration: 180,
        revealChild: false,
        child: newTaskEntry,
    });
    const confirmAddTask = Revealer({
        transition: "slide_right",
        transitionDuration: 180,
        revealChild: false,
        child: Button({
            className: "txt-norm icon-material sidebar-todo-add",
            halign: "end",
            vpack: "center",
            label: "arrow_upward",
            setup: setupCursorHover,
            onClicked: () => {
                if (newTaskEntry.text == "") return;
                Todo.add(newTaskEntry.text);
                newTaskEntry.text = "";
            },
        }),
    });
    return Box({
        // The list, with a New button
        vertical: true,
        className: "spacing-v-5",
        setup: box => {
            box.pack_start(TodoItems(false), true, true, 0);
            box.pack_start(
                Box({
                    setup: self => {
                        self.pack_start(cancelAddTask, false, false, 0);
                        self.pack_start(newTaskEntryRevealer, true, true, 0);
                        self.pack_start(confirmAddTask, false, false, 0);
                        self.pack_start(newTaskButton, false, false, 0);
                    },
                }),
                false,
                false,
                0
            );
        },
    });
};

export const TodoWidget = () =>
    TabContainer({
        icons: ["format_list_bulleted", "task_alt"],
        names: ["Unfinished", "Done"],
        children: [UndoneTodoList(), TodoItems(true)],
    });
