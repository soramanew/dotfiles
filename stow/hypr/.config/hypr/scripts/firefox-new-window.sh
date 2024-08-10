#!/bin/fish

if ! hyprctl -j clients | jq -e 'first(.[] | select(.class == "firefox"))'
    # First firefox startup
    firefox & disown
else
    # Use firefox shortcut to open new window so sidebar stays open
    hyprctl dispatch sendshortcut "Ctrl, N, address:$(hyprctl clients -j | jq -r 'first(.[] | select(.class == "firefox")).address')"
end
