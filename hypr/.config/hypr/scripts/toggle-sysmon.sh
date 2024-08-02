#!/bin/bash

if hyprctl -j clients | jq -e '[.[] | select(.class == "btop" and .title == "btop" and .workspace.name == "special:sysmon")] == []'; then
    foot -a "btop" -T "btop" fish -C "btop" &
fi

hyprctl dispatch togglespecialworkspace sysmon
