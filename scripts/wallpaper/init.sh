#!/bin/fish

if [ "$(cat ~/.cache/ags/user/wallpaper/enabled.txt)" = 'true' ]
    dotctl wallpaper change
else
    dotctl wallpaper change -f (cat ~/.cache/ags/user/wallpaper/last.txt)
end
