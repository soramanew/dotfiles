#!/bin/bash

vesktop=$(hyprctl -j clients | jq '[.[]] | map(select(.class == "vesktop"))')
if echo "$vesktop" | jq -e '. == []'; then
    # No vesktop client
    vesktop --enable-features=WebRTCPipeWireCapturer &
elif echo "$vesktop" | jq -e '.[0].workspace.name != "special:vesktop"'; then
    # vesktop client not in correct workspace
    vesktop_addr=$(echo "$vesktop" | jq -r '.[0].address')
    hyprctl dispatch movetoworkspacesilent "special:vesktop,address:$vesktop_addr"
fi

hyprctl dispatch togglespecialworkspace vesktop
