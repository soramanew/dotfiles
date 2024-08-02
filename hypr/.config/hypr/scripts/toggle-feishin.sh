#!/bin/bash

feishin=$(hyprctl -j clients | jq '[.[] | select(.class == "feishin")]')
if echo "$feishin" | jq -e '. == []'; then
    # No feishin client
    feishin &
elif echo "$feishin" | jq -e '.[0].workspace.name != "special:music"'; then
    # Feishin client not in correct workspace
    feishin_addr=$(echo "$feishin" | jq -r '.[0].address')
    hyprctl dispatch movetoworkspacesilent "special:music,address:$feishin_addr"
fi

hyprctl dispatch togglespecialworkspace music
