#!/bin/fish

set script_name (basename (status filename))
set wallpapers_dir ~/Pictures/Wallpapers/
set threshold 80

# Max 0 non-option args | h, f and d are exclusive | F and t are also exclusive
argparse -n $script_name -X 0 -x 'h,f,d' -x 'F,t' \
    'h/help' \
    'f/file=!test -f "$_flag_value"' \
    'd/directory=!test -d "$_flag_value"' \
    'F/no-filter' \
    't/threshold=!_validate_int --min 0' \
    -- $argv
or exit

if set -q _flag_h
    echo 'Usage:'
    echo '    '$script_name
    echo '    '$script_name' [ -h | --help ]'
    echo '    '$script_name' [ -f | --file ]'
    echo '    '$script_name' [ -d | --directory ] [ -F | --no-filter ]'
    echo '    '$script_name' [ -d | --directory ] [ -t | --threshold ]'
    echo
    echo 'Options:'
    echo '    -h, --help                    Print this help message and exit'
    echo '    -f, --file <file>             The file to change wallpaper to'
    echo '    -d, --directory <directory>   The folder to select a random wallpaper from (default '$wallpapers_dir')'
    echo '    -F, --no-filter               Do not filter by size'
    echo '    -t, --threshold <threshold>   The minimum percentage of the size the image must be greater than to be selected (default '$threshold')'

    exit
else
    set cache_dir ~/.cache/ags/user/wallpaper

    # The path to the last chosen wallpaper
    set last_wallpaper_path "$cache_dir/last.txt"

    # Use wallpaper given as argument else choose random
    if set -q _flag_f
        set chosen_wallpaper "$(cd $(dirname $_flag_f) && pwd)/$(basename $_flag_f)"

        # Set last wallpaper if not same as given
        if [ -f "$last_wallpaper_path" ]
            set last_wallpaper "$(cat $last_wallpaper_path)"
            [ -z "$last_wallpaper" -o "$last_wallpaper" = "$chosen_wallpaper" ] && set -e last_wallpaper
        end
    else
        # The path to the directory containing the selection of wallpapers
        set -q _flag_d && set wallpapers_dir $_flag_d

        # Get all files in $wallpapers_dir and exclude the last wallpaper (if it exists)
        set last_wallpaper (cat $last_wallpaper_path)
        if [ -f "$last_wallpaper_path" -a -n "$last_wallpaper" ]
            set unfiltered_wallpapers (find $wallpapers_dir -type f | grep -v $last_wallpaper)
        else
            set -e last_wallpaper
            set unfiltered_wallpapers (find $wallpapers_dir -type f)
        end

        # Filter by resolution if no filter option is not given
        if set -q _flag_F
            set wallpapers $unfiltered_wallpapers
        else
            set -l screen_size (hyprctl monitors -j | jq -r '.[0] | "\(.width)\n\(.height)"')
            set -l wall_sizes (identify -ping -format '%w %h\n' $unfiltered_wallpapers)

            # Apply threshold
            set -q _flag_t && set threshold $_flag_t
            set screen_size[1] (math $screen_size[1] x $threshold / 100)
            set screen_size[2] (math $screen_size[2] x $threshold / 100)

            # Add wallpapers that are larger than the screen size * threshold to list to choose from ($wallpapers)
            for i in (seq 1 (count $wall_sizes))
                set -l wall_size (string split ' ' $wall_sizes[$i])
                if [ $wall_size[1] -ge $screen_size[1] -a $wall_size[2] -ge $screen_size[2] ]
                    set -a wallpapers $unfiltered_wallpapers[$i]
                end
            end
        end

        # Chech if the $wallpapers list is unset or empty
        if ! set -q wallpapers || [ -z "$wallpapers" ]
            echo "No eligible files found in $wallpapers_dir"
            exit 1
        end

        # Choose a random wallpaper from the $wallpapers list
        set chosen_wallpaper (random choice $wallpapers)
    end

    # Store the wallpaper chosen
    mkdir -p $cache_dir
    echo $chosen_wallpaper > $last_wallpaper_path
    ln -sf $chosen_wallpaper "$cache_dir/currentwall"

    # Apply colours from wallpaper to ags & stuff
    ~/.config/ags/scripts/color_generation/colorgen.sh $chosen_wallpaper --apply || echo "Failed to switch colour scheme"

    # Change the wallpaper and output change if success
    hyprctl hyprpaper preload $chosen_wallpaper
    for monitor in $(hyprctl -j monitors | jq --raw-output0 '.[] | .name' | string split0)
        hyprctl hyprpaper wallpaper "$monitor,$chosen_wallpaper" && echo "Changed wallpaper on $monitor to $chosen_wallpaper"
    end

    # Unload previous wallpaper to preserve memory
    set -q last_wallpaper && hyprctl hyprpaper unload $last_wallpaper
end
