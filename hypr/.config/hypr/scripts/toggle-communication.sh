#!/bin/bash

if hyprctl -j clients | jq '[.[]] | map(select(.class == "vesktop"))' | jq -e '. == []'; then
    # No vesktop client
    vesktop --enable-features=WebRTCPipeWireCapturer &
fi

if hyprctl -j clients | jq '[.[]] | map(select(.class == "whatsapp"))' | jq -e '. == []'; then
    # No whatsapp window
    waterfox --new-instance --name whatsapp -P whatsapp &
fi

hyprctl dispatch togglespecialworkspace communication
