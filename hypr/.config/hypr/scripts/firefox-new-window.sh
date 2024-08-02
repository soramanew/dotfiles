#!/bin/fish

function get_firefox_addr
    # Address of newly opened window, gotten by match workspace, class, title and sort by focus history
    hyprctl clients -j | jq -r '[.[] | select(.workspace.name == '(hyprctl activeworkspace -j | jq '.name')' and .class == "firefox" and .title == "Mozilla Firefox")] | sort_by(.focusHistoryID)[0].address'
end

if hyprctl -j clients | jq -e '[.[]] | map(select(.class == "feishin")) == []'
    # First firefox startup
    firefox & disown
else
    set window_addr (get_firefox_addr)

    # Open new window
    firefox

    # Attempt to open sidebery tabs sidebar
    set attempts 0
    while [ $attempts -le 5 ]
        sleep .1  # Some delay for the window to open
        set new_window_addr (get_firefox_addr)
        # Window exists and is not the same as previous before opened
        if [ "$new_window_addr" != 'null' -a "$new_window_addr" != "$window_addr" ]
            # Send shortcut to toggle sidebery
            hyprctl dispatch sendshortcut "Ctrl, E, address:$new_window_addr"
            break
        end
        set attempts (math $attempts + 1)
    end

    # Print if out of attempts
    [ $attempts -le 5 ] || echo "Out of attempts: unable to toggle Sidebery for newly opened Firefox window."
end
