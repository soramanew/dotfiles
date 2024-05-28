#!/bin/bash

btops=$(hyprctl -j clients | jq '[.[]] | map(select(.class == "btop" and .title == "btop" and .workspace.name == "special:sysmon"))' | jq length)

if [ $btops -le 0 ]; then
    foot -a "btop" -T "btop" fish -C "btop" &
fi

hyprctl dispatch togglespecialworkspace sysmon
