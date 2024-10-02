#!/bin/python

"""
Syntax:
    Headers:
        #H <material icon> <header>

    Columns:
        #c

    Groups:
        #g { <group key combo> | } <group description>
        ...
        #eg
        Groups cannot be nested, so starting another group without ending the first will
        automatically end the previous group.

    Hiding binds:
        By line:
            ... #h
        By group:
            #h
            ...
            #eh
            Same as groups.

    Description prefixes:
        #p <prefix (empty for no prefix)>
"""

import json
import re
import sys
from pathlib import Path

mod_subs = {"Super": "󰖳", "Control": "Ctrl"}
key_subs = {
    "Super_L": "",
    "Minus": "-",
    "Equal": "=",
    "Page_Up": "PageUp",
    "Page_Down": "PageDown",
    "Slash": "/",
    "BackSlash": "\\",
    "Escape": "Esc",
    "Delete": "Del",
    "Print": "PrtSc",
    "mouse:272": "Lmb",
    "mouse:273": "Rmb",
    "left": "←",
    "right": "→",
    "up": "↑",
    "down": "↓",
}


def sub(s: str, d: dict[str, str]) -> str:
    return d[s] if s in d else s


class KeyCombo:
    def __init__(self, args: str):
        mods, key, *_ = args.split(",", 2)
        mods = mods.strip()
        self.mods: list[str] = (
            [sub(k.strip(), mod_subs) for k in re.split(r"\+|&|_", mods)]
            if mods
            else []
        )
        self.key: str = sub(key.strip(), key_subs)


class Bind:
    def __init__(self, description: str, explicit_combos: list[KeyCombo] = None):
        self.description: str = f"{prefix} {description.strip()}".strip()
        self.key_combos: list[KeyCombo] = (
            explicit_combos if explicit_combos is not None else []
        )
        self.explicit_combo: bool = explicit_combos is not None


class Section:
    def __init__(self, icon: str, header: str):
        self.icon: str = icon
        self.header: str = header
        self.binds: list[Bind] = []

        current_column.append(self)

    def add_bind(self, args: str) -> None:
        key_args, description = args.rsplit("#", 1)
        bind = Bind(description)
        bind.key_combos.append(KeyCombo(key_args))
        self.binds.append(bind)


current_column: list[Section] = []
current_section: Section = None
current_group: Bind | None = None
binds: list[list[Section]] = [current_column]
hidden: bool = False
prefix: str = ""


with Path(
    sys.argv[1] if len(sys.argv) > 1 else "~/.config/hypr/hyprland/keybinds.conf"
).expanduser().open("r") as file:
    while line := file.readline():
        line = line.strip()

        # Is comment
        if line.startswith("#"):
            if line.startswith("#H"):  # Header
                current_section = Section(*line[2:].strip().split(" ", 1))
            if line.startswith("#c"):
                current_column = []
                binds.append(current_column)
            elif line.startswith("#h"):  # Hidden start
                hidden = True
            elif line.startswith("#eh"):  # Hidden end
                hidden = False
            elif line.startswith("#g"):  # Group start
                group_args = line[2:].strip()
                if "|" in group_args:
                    *keys_args, desc = group_args.split("|")
                    current_group = Bind(desc, [KeyCombo(k) for k in keys_args])
                else:
                    current_group = Bind(group_args)
                current_section.binds.append(current_group)
            elif line.startswith("#eg"):  # Group end
                current_group = None
            elif line.startswith("#p"):
                prefix = line[2:].strip()
            continue

        # Hidden, current group already has explicit key combo defined, or line is not a bind
        if (
            hidden
            or line.endswith("#h")
            or (current_group is not None and current_group.explicit_combo)
            or not line.startswith("bind")
        ):
            continue

        args = line.split("=", 1)[1]
        if current_group is None:
            current_section.add_bind(args)
        else:
            current_group.key_combos.append(KeyCombo(args))

print(json.dumps(binds, default=lambda o: o.__dict__))
