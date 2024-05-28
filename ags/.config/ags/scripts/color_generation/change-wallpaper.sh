#!/bin/fish

### ===================== ###

# See https://github.com/hyprwm/hyprpaper for accepted image types

### ===================== ###

set cache_dir ~/.cache/ags/user/wallpaper

# The path to the last chosen wallpaper
set last_wallpaper_path $cache_dir'/last.txt'

# Use wallpaper given as argument else choose random
if [ -f "$argv[1]" ]
    set chosen_wallpaper "$(cd $(dirname $argv[1]) && pwd)/$(basename $argv[1])"
    [ -f "$last_wallpaper_path" -a -n "$(cat $last_wallpaper_path)" ] && set last_wallpaper $(cat $last_wallpaper_path)
else
    # The path to the directory containing the selection of wallpapers
    [ -d "$argv[1]" ] && set wallpapers_dir $argv[1] || set wallpapers_dir ~/Pictures/Wallpapers/

    # Get all files in $wallpapers_dir and exclude the last wallpaper (if it exists)
    if [ -f "$last_wallpaper_path" -a -n "$(cat $last_wallpaper_path)" ]
        set last_wallpaper $(cat $last_wallpaper_path)
        set wallpapers $(find $wallpapers_dir -type f | grep -v $last_wallpaper)
    else
        set wallpapers $(find $wallpapers_dir -type f)
    end

    # Chech if the $wallpapers array is empty
    if [ -z "$wallpapers" ]
        echo "No eligible files found in $wallpapers_dir"
        exit 0
    end

    # Choose a random wallpaper from the $wallpapers array
    set chosen_wallpaper $(random choice $wallpapers)
end

# Store the wallpaper chosen
if mkdir -p $cache_dir
    echo $chosen_wallpaper > $last_wallpaper_path
    ln -sf $chosen_wallpaper $cache_dir'/currentwall'
end

# Apply colours from wallpaper to ags & stuff
~/.config/ags/scripts/color_generation/colorgen.sh $chosen_wallpaper --apply --smart || echo "Failed to switch colour scheme"

# Change the wallpaper and output change if success
hyprctl hyprpaper preload $chosen_wallpaper
for monitor in $(hyprctl -j monitors | jq --raw-output0 '.[] | .name' | string split0)
    hyprctl hyprpaper wallpaper "$monitor,$chosen_wallpaper" && echo "Changed wallpaper on $monitor to $chosen_wallpaper"
end
set -q last_wallpaper && hyprctl hyprpaper unload $last_wallpaper