#!/bin/fish

### ===================== ###

# See https://github.com/LGFae/swww for accepted image types

### ===================== ###

function choose-transition
    ## ------------------------------ ##

    # Chooses a random transition for the wallpaper change

    ## ------------------------------ ##

    set -l transitions 'fade' 'wipewave' 'any'
    set -l chosen_transition "$(random choice $transitions)"
    if [ $chosen_transition = 'wipewave' ]
        if [ $(random 0 1) -eq 0 ]
            echo 'wipe'
            echo '--transition-angle'
            echo "$(random 0 360)"
        else
            echo 'wave'
            echo '--transition-angle'
            echo "$(random 0 360)"
            echo '--transition-wave'
            echo "$(random 20 70),$(random 20 70)"
        end
    else
        echo $chosen_transition
    end
end

set cache_dir ~/.cache/ags/user/wallpaper-change

# The path to the last chosen wallpaper
set last_wallpaper_path $cache_dir/last.txt

# Use wallpaper given as argument else choose random
if [ -f "$argv[1]" ]
    set chosen_wallpaper $argv[1]
else
    # The path to the directory containing the selection of wallpapers
    [ -d "$argv[1]" ] && set wallpapers_dir $argv[1] || set wallpapers_dir ~/Pictures/Wallpapers/

    # Get all files in $wallpapers_dir and exclude the last wallpaper (if it exists)
    if [ -f "$last_wallpaper_path" -a -n "$(cat $last_wallpaper_path)" ]
        set wallpapers $(find $wallpapers_dir -type f | grep -v $(cat $last_wallpaper_path))
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
mkdir -p $cache_dir && echo $chosen_wallpaper > $last_wallpaper_path

# Apply colours from wallpaper to ags & stuff
~/.config/ags/scripts/color_generation/colorgen.sh $chosen_wallpaper --apply --smart || echo "Failed to switch colour scheme"

sleep 1

# Change the wallpaper with a random transition and output change if success
swww img $chosen_wallpaper -t $(choose-transition) && echo "Changed wallpaper to $chosen_wallpaper"
