#!/bin/bash

if hyprctl -j clients | jq -e '[.[] | select(.class == "vesktop")] == []'; then
    # No vesktop client
    vesktop --enable-features=WebRTCPipeWireCapturer &
fi

if hyprctl -j clients | jq -e '[.[] | select(.class == "whatsapp")] == []'; then
    # No whatsapp window
    waterfox --new-instance --name whatsapp -P whatsapp &
fi

hyprctl dispatch togglespecialworkspace communication
