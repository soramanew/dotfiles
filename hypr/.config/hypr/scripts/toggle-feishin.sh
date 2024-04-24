#!/bin/bash

feishin=$(hyprctl -j clients | jq '[.[]] | map(select(.class == "feishin"))')
if echo "$feishin" | jq -e '. == []'; then
    # No feishin client
    feishin &
elif echo "$feishin" | jq -e '.[0].workspace.name != "special:feishin"'; then
    # Feishin client not in correct workspace
    feishin_addr=$(echo "$feishin" | jq -r '.[0].address')
    hyprctl dispatch movetoworkspacesilent "special:feishin,address:$feishin_addr"
fi

hyprctl dispatch togglespecialworkspace feishin
