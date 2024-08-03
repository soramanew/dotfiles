#!/bin/bash

if ! hyprctl -j clients | jq -e 'first(.[] | select(.class == "btop" and .title == "btop" and .workspace.name == "special:sysmon"))'; then
    foot -a "btop" -T "btop" fish -C "btop" & disown
fi

hyprctl dispatch togglespecialworkspace sysmon
