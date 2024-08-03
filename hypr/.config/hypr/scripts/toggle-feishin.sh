#!/bin/bash

if ! hyprctl -j clients | jq -e 'first(.[] | select(.class == "feishin"))'; then
    # No feishin client
    feishin & disown
elif hyprctl -j clients | jq -e 'first(.[] | select(.class == "feishin")).workspace.name != "special:music"'; then
    # Feishin client not in correct workspace
    feishin_addr=$(hyprctl -j clients | jq -r 'first(.[] | select(.class == "feishin")).address')
    hyprctl dispatch movetoworkspacesilent "special:music,address:$feishin_addr"
fi

hyprctl dispatch togglespecialworkspace music
