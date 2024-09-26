#!/bin/bash

if ! hyprctl -j clients | jq -e 'first(.[] | select(.class == "vesktop"))'; then
    # No vesktop client
    vesktop --enable-features=WebRTCPipeWireCapturer & disown
elif hyprctl -j clients | jq -e 'first(.[] | select(.class == "vesktop")).workspace.name != "special:communication"'; then
    # Vesktop client not in correct workspace
    vesktop_addr=$(hyprctl -j clients | jq -r 'first(.[] | select(.class == "vesktop")).address')
    hyprctl dispatch movetoworkspacesilent "special:communication,address:$vesktop_addr"
fi

# Has whatsapp firefox profile
if grep -q 'Name=whatsapp' ~/.mozilla/firefox/profiles.ini; then
    if ! hyprctl -j clients | jq -e 'first(.[] | select(.class == "whatsapp"))'; then
        # No whatsapp window
        firefox --name whatsapp -P whatsapp 'https://web.whatsapp.com' & disown
    elif hyprctl -j clients | jq -e 'first(.[] | select(.class == "whatsapp")).workspace.name != "special:communication"'; then
        # Whatsapp window not in correct workspace
        whatsapp_addr=$(hyprctl -j clients | jq -r 'first(.[] | select(.class == "whatsapp")).address')
        hyprctl dispatch movetoworkspacesilent "special:communication,address:$whatsapp_addr"
    fi
fi

hyprctl dispatch togglespecialworkspace communication
