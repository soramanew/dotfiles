#!/bin/fish

function move-client -a selector
    if hyprctl -j clients | jq -e 'first(.[] | select('$selector')).workspace.name != "special:music"'
        # Window not in correct workspace
        set window_addr $(hyprctl -j clients | jq -r 'first(.[] | select('$selector')).address')
        hyprctl dispatch movetoworkspacesilent "special:music,address:$window_addr"
    end
end

move-client '.class == "feishin"'
move-client '.class == "Spotify" or .initialTitle == "Spotify" or .initialTitle == "Spotify Free"'

hyprctl dispatch togglespecialworkspace music
