#!/bin/fish

argparse -i 'n/no-initial' 'N/no-final' -- $argv
or exit

mkdir -p ~/.cache/ags/overview

function screenshot
    # Active workspace id (including special)
    set active_ws (hyprctl activewindow -j | jq -e '.workspace.id // empty' \
        || hyprctl activeworkspace -j | jq '.id')
    # Cache save file
    set ws_sc ~/.cache/ags/overview/$active_ws.png
    # Update file if not exists or latest mod is more than 1 seconds ago (avoid lag when spamming)
    if test ! -f $ws_sc || test (math (date +%s) - (date +%s -r $ws_sc)) -gt 1
        grim -l 0 $ws_sc
    end
end

# Screenshot before leaving ws if flag not given
set -q _flag_n || screenshot

# Exec post command (if given)
if count $argv >/dev/null
    test -x $argv[1] && $argv[1..] || hyprctl dispatch $argv
    # Screenshot after entering ws
    if ! set -q _flag_N
        sleep .5 && screenshot
    end
end
