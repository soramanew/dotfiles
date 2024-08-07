#!/bin/fish

if [ "$(cat ~/.cache/ags/user/wallpaper/enabled.txt)" = 'true' ]
    ~/.config/ags/scripts/color_generation/change-wallpaper.sh
else
    ~/.config/ags/scripts/color_generation/change-wallpaper.sh -f "$(cat ~/.cache/ags/user/wallpaper/last.txt)"
end
