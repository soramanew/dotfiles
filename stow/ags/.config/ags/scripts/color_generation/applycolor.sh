#!/usr/bin/env bash

# Make generated cache dir if it doesn't exist
mkdir -p "$HOME"/.cache/ags/user/generated
cd "$HOME/.config/ags" || exit

colourmodefile="$HOME/.cache/ags/user/colormode.txt"
if [ -f "$colourmodefile" -a "$(sed -n '2p' "$colourmodefile")" = 'transparent' ]; then
    transparent=true
fi


join-by() {
    local IFS="$1"
    shift
    echo "$*"
}

transparentize() {
    if [ "$transparent" != true ]; then
        echo -n "$1"
    else
        local hex="$1"
        local alpha="$2"
        local red green blue

        red=$((16#${hex:1:2}))
        green=$((16#${hex:3:2}))
        blue=$((16#${hex:5:2}))

        printf 'rgba(%d, %d, %d, %.2f)' "$red" "$green" "$blue" "$alpha"
    fi
}

get_light_dark() {
    lightdark=""
    if [ ! -f "$HOME"/.cache/ags/user/colormode.txt ]; then
        echo "" > "$HOME"/.cache/ags/user/colormode.txt
    else
        lightdark=$(sed -n '1p' "$HOME/.cache/ags/user/colormode.txt")
    fi
    echo "$lightdark"
}

apply_fuzzel() {
    [ "$transparent" = true ] && template_name='not_opaque.ini' || template_name='opaque.ini'

    # Check if scripts/templates/fuzzel/opaque.ini (or not_opaque.ini, depends whether transparency enabled) exists
    if [ ! -f "scripts/templates/fuzzel/$template_name" ]; then
        echo "Template file not found for Fuzzel. Skipping that."
        return
    fi

    # Copy template
    mkdir -p "$HOME"/.cache/ags/user/generated/fuzzel
    cp "scripts/templates/fuzzel/$template_name" "$HOME"/.cache/ags/user/generated/fuzzel/fuzzel.ini

    # Apply colours
    for i in "${!colourlist[@]}"; do
        sed -i "s/{{ ${colourlist[$i]} }}/${colourvalues[$i]#\#}/g" "$HOME"/.cache/ags/user/generated/fuzzel/fuzzel.ini
    done

    mkdir -p "$HOME"/.config/fuzzel
    cp "$HOME"/.cache/ags/user/generated/fuzzel/fuzzel.ini "$HOME"/.config/fuzzel/fuzzel.ini
}

apply_cava() {
    # Check if scripts/templates/terminal/cava exists
    if [ ! -f "scripts/templates/terminal/cava" ]; then
        echo "Template file not found for CAVA. Skipping that."
        return
    fi

    # Copy template
    mkdir -p "$HOME"/.cache/ags/user/generated/terminal
    cp "scripts/templates/terminal/cava" "$HOME"/.cache/ags/user/generated/terminal/cava

    # Apply colours
    for i in "${!colourlist[@]}"; do
        sed -i "s/{{ ${colourlist[$i]} }}/${colourvalues[$i]#\#}/g" "$HOME"/.cache/ags/user/generated/terminal/cava
    done

    mkdir -p "$HOME"/.config/cava
    cp "$HOME"/.cache/ags/user/generated/terminal/cava "$HOME"/.config/cava/config
    killall -USR2 cava
}

apply_term() {
    # Check if terminal escape sequence template exists
    if [ ! -f "scripts/templates/terminal/sequences.txt" ]; then
        echo "Template file not found for Terminal. Skipping that."
        return
    fi

    # Copy template
    mkdir -p "$HOME"/.cache/ags/user/generated/terminal
    cp "scripts/templates/terminal/sequences.txt" "$HOME"/.cache/ags/user/generated/terminal/sequences.txt

    # Apply colours
    for i in "${!colourlist[@]}"; do
        sed -i "s/${colourlist[$i]} #/${colourvalues[$i]#\#}/g" "$HOME"/.cache/ags/user/generated/terminal/sequences.txt
    done

    # Set terminal alpha
    [ "$transparent" = true ] && term_alpha=90 || term_alpha=100
    sed -i "s/\$alpha/$term_alpha/g" "$HOME/.cache/ags/user/generated/terminal/sequences.txt"

    for file in /dev/pts/*; do
      if [[ $file =~ ^/dev/pts/[0-9]+$ ]]; then
        cat "$HOME"/.cache/ags/user/generated/terminal/sequences.txt > "$file"
      fi
    done
}

apply_hyprland() {
    # Check if scripts/templates/hypr/hyprland/colours.conf exists
    if [ ! -f "scripts/templates/hypr/hyprland/colours.conf" ]; then
        echo "Template file not found for Hyprland colours. Skipping that."
        return
    fi

    # Copy template
    mkdir -p "$HOME"/.cache/ags/user/generated/hypr/hyprland
    cp "scripts/templates/hypr/hyprland/colours.conf" "$HOME"/.cache/ags/user/generated/hypr/hyprland/colours.conf

    local colour_commands=()

    process-colour-command() {
        local colour_name="$1" hypr_keyword="$2" fstring="$3"

        if [ "${colourlist[$i]}" = "$colour_name" ]; then
            colour_commands+=("keyword $hypr_keyword $(printf "$fstring" "${colourvalues[$i]#\#}")")
        fi
    }

    # Apply colours
    for i in "${!colourlist[@]}"; do
        sed -i "s/{{ ${colourlist[$i]} }}/${colourvalues[$i]#\#}/g" "$HOME"/.cache/ags/user/generated/hypr/hyprland/colours.conf

        process-colour-command '$tertiaryContainer' 'general:col.active_border' 'rgba(%sd5)'
        process-colour-command '$outline' 'general:col.inactive_border' 'rgba(%s50)'
        process-colour-command '$surface' 'misc:background_color' 'rgba(%sff)'
        process-colour-command '$primary' 'windowrulev2' 'bordercolor rgba(%se2), pinned:1'
    done

    # Use dynamic set to avoid hypr reload so no cursor warp
    hyprctl --batch "$(join-by ';' "${colour_commands[@]}")"

    # Copy to hypr config but no autoreload
    local prev=$(hyprctl getoption misc:disable_autoreload -j | jq '.int')
    hyprctl keyword misc:disable_autoreload 1
    cp "$HOME"/.cache/ags/user/generated/hypr/hyprland/colours.conf "$HOME"/.config/hypr/hyprland/colours.conf
    sync  # Ugh cp is async
    hyprctl keyword misc:disable_autoreload "$prev"

    # Delete nested function
    unset -f process-colour-command
}

apply_hyprlock() {
    # Check if scripts/templates/hypr/hyprlock.conf exists
    if [ ! -f "scripts/templates/hypr/hyprlock.conf" ]; then
        echo "Template file not found for hyprlock. Skipping that."
        return
    fi

    # Copy template
    mkdir -p "$HOME"/.cache/ags/user/generated/hypr/
    cp "scripts/templates/hypr/hyprlock.conf" "$HOME"/.cache/ags/user/generated/hypr/hyprlock.conf

    # Apply colours
    for i in "${!colourlist[@]}"; do
        sed -i "s/{{ ${colourlist[$i]} }}/${colourvalues[$i]#\#}/g" "$HOME"/.cache/ags/user/generated/hypr/hyprlock.conf
    done

    cp "$HOME"/.cache/ags/user/generated/hypr/hyprlock.conf "$HOME"/.config/hypr/hyprlock.conf
}

apply_gtk() {  # Using gradience-cli
    lightdark=$(get_light_dark)

    # Copy template
    mkdir -p "$HOME"/.cache/ags/user/generated/gradience
    cp "scripts/templates/gradience/preset.json" "$HOME"/.cache/ags/user/generated/gradience/preset.json

    # Apply colours
    for i in "${!colourlist[@]}"; do
        # Match all transparentize and get alpha, uniq so only unique values cause sed replace all
        sed -nE 's/.*\{\{ transparentize \'"${colourlist[$i]}"' ((0?\.[0-9]+)|[01]) }}.*/\1/p' "$HOME"/.cache/ags/user/generated/gradience/preset.json | uniq | while read -r alpha; do
            # Transparentize colour
            sed -i "s/{{ transparentize ${colourlist[$i]} $alpha }}/$(transparentize ${colourvalues[$i]} $alpha)/g" "$HOME"/.cache/ags/user/generated/gradience/preset.json
        done
        # Replace all instances of colour
        sed -i "s/{{ ${colourlist[$i]} }}/${colourvalues[$i]}/g" "$HOME"/.cache/ags/user/generated/gradience/preset.json
    done

    mkdir -p "$HOME/.config/presets"  # Create gradience presets folder
    gradience-cli apply -p "$HOME"/.cache/ags/user/generated/gradience/preset.json --gtk both

    # Set light/dark preference
    # And set GTK theme manually as Gradience defaults to light adw-gtk3
    # (which is unreadable when broken when you use dark mode)
    if [ "$lightdark" = "light" ]; then
        gsettings set org.gnome.desktop.interface gtk-theme 'adw-gtk3'
        gsettings set org.gnome.desktop.interface color-scheme 'prefer-light'
    else
        gsettings set org.gnome.desktop.interface gtk-theme adw-gtk3-dark
        gsettings set org.gnome.desktop.interface color-scheme 'prefer-dark'
    fi
}

apply_ags() {
    ags run-js 'reloadCss();'
    ags run-js 'openColourScheme();'
}

apply_slurp() {
    # Check if scripts/templates/slurp/args.txt exists
    if [ ! -f "scripts/templates/slurp/args.txt" ]; then
        echo "Template file not found for slurp. Skipping that."
        return
    fi

    # Copy template
    mkdir -p "$HOME"/.cache/ags/user/generated/slurp/
    cp "scripts/templates/slurp/args.txt" "$HOME"/.cache/ags/user/generated/slurp/args.txt

    # Apply colours
    for i in "${!colourlist[@]}"; do
        sed -i "s/{{ ${colourlist[$i]} }}/${colourvalues[$i]#\#}/g" "$HOME"/.cache/ags/user/generated/slurp/args.txt
    done

    mkdir -p "$HOME"/.config/slurp/
    cp "$HOME"/.cache/ags/user/generated/slurp/args.txt "$HOME"/.config/slurp/args.txt
}


colournames=$(cat scss/_material.scss | cut -d: -f1)
colourstrings=$(cat scss/_material.scss | cut -d: -f2 | cut -d ' ' -f2 | cut -d ";" -f1)
IFS=$'\n'
colourlist=( $colournames ) # Array of colour names
colourvalues=( $colourstrings ) # Array of colour values

apply_ags &
apply_hyprland &
apply_hyprlock &
apply_gtk &
apply_fuzzel &
apply_term &
apply_slurp &
apply_cava &
