#!/usr/bin/env bash

term_alpha=70 #Set this to < 100 make all your terminals transparent
# sleep 0 # idk i wanted some delay or colors dont get applied properly
if [ ! -d "$HOME"/.cache/ags/user/generated ]; then
    mkdir -p "$HOME"/.cache/ags/user/generated
fi
cd "$HOME/.config/ags" || exit

colornames=''
colorstrings=''
colorlist=()
colorvalues=()

transparentize() {
  local hex="$1"
  local alpha="$2"
  local red green blue

  red=$((16#${hex:1:2}))
  green=$((16#${hex:3:2}))
  blue=$((16#${hex:5:2}))

  printf 'rgba(%d, %d, %d, %.2f)' "$red" "$green" "$blue" "$alpha"
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
    # Check if scripts/templates/fuzzel/opaque.ini and not_opaque.ini exists
    if [ ! -f "scripts/templates/fuzzel/opaque.ini" ] || [ ! -f "scripts/templates/fuzzel/not_opaque.ini" ]; then
        echo "Template files not found for Fuzzel. Skipping that."
        return
    fi
    # Copy template
    mkdir -p "$HOME"/.cache/ags/user/generated/fuzzel
    cp "scripts/templates/fuzzel/opaque.ini" "$HOME"/.cache/ags/user/generated/fuzzel/opaque.ini
    cp "scripts/templates/fuzzel/not_opaque.ini" "$HOME"/.cache/ags/user/generated/fuzzel/not_opaque.ini
    # Apply colors
    for i in "${!colorlist[@]}"; do
        sed -i "s/{{ ${colorlist[$i]} }}/${colorvalues[$i]#\#}/g" "$HOME"/.cache/ags/user/generated/fuzzel/opaque.ini
        sed -i "s/{{ ${colorlist[$i]} }}/${colorvalues[$i]#\#}/g" "$HOME"/.cache/ags/user/generated/fuzzel/not_opaque.ini
    done

    cp "$HOME"/.cache/ags/user/generated/fuzzel/opaque.ini "$HOME"/.config/fuzzel/opaque/generated.ini
    cp "$HOME"/.cache/ags/user/generated/fuzzel/not_opaque.ini "$HOME"/.config/fuzzel/not_opaque/generated.ini
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
    # Apply colors
    for i in "${!colorlist[@]}"; do
        sed -i "s/${colorlist[$i]} #/${colorvalues[$i]#\#}/g" "$HOME"/.cache/ags/user/generated/terminal/sequences.txt
    done

    sed -i "s/\$alpha/$term_alpha/g" "$HOME/.cache/ags/user/generated/terminal/sequences.txt"

    for file in /dev/pts/*; do
      if [[ $file =~ ^/dev/pts/[0-9]+$ ]]; then
        cat "$HOME"/.cache/ags/user/generated/terminal/sequences.txt > "$file"
      fi
    done
}

apply_hyprland() {
    # Check if scripts/templates/hypr/hyprland/colors.conf exists
    if [ ! -f "scripts/templates/hypr/hyprland/colors.conf" ]; then
        echo "Template file not found for Hyprland colors. Skipping that."
        return
    fi
    # Copy template
    mkdir -p "$HOME"/.cache/ags/user/generated/hypr/hyprland
    cp "scripts/templates/hypr/hyprland/colors.conf" "$HOME"/.cache/ags/user/generated/hypr/hyprland/colors.conf
    # Apply colors
    for i in "${!colorlist[@]}"; do
        sed -i "s/{{ ${colorlist[$i]} }}/${colorvalues[$i]#\#}/g" "$HOME"/.cache/ags/user/generated/hypr/hyprland/colors.conf
    done

    cp "$HOME"/.cache/ags/user/generated/hypr/hyprland/colors.conf "$HOME"/.config/hypr/hyprland/colour/generated.conf
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
    # Apply colors
    # sed -i "s/{{ SWWW_WALL }}/${wallpath_png}/g" "$HOME"/.cache/ags/user/generated/hypr/hyprlock.conf
    for i in "${!colorlist[@]}"; do
        sed -i "s/{{ ${colorlist[$i]} }}/${colorvalues[$i]#\#}/g" "$HOME"/.cache/ags/user/generated/hypr/hyprlock.conf
    done

    cp "$HOME"/.cache/ags/user/generated/hypr/hyprlock.conf "$HOME"/.config/hypr/hyprlock.conf
}

apply_gtk() { # Using gradience-cli
    lightdark=$(get_light_dark)

    # Copy template
    mkdir -p "$HOME"/.cache/ags/user/generated/gradience
    cp "scripts/templates/gradience/preset.json" "$HOME"/.cache/ags/user/generated/gradience/preset.json

    # Apply colors
    for i in "${!colorlist[@]}"; do
        # Match all transparentize and get alpha, uniq so only unique values cause sed replace all
        sed -nE 's/.*\{\{ transparentize \'"${colorlist[$i]}"' ((0?\.[0-9]+)|[01]) }}.*/\1/p' "$HOME"/.cache/ags/user/generated/gradience/preset.json | uniq | while read -r alpha; do
            # Transparentize colour
            sed -i "s/{{ transparentize ${colorlist[$i]} $alpha }}/$(transparentize ${colorvalues[$i]} $alpha)/g" "$HOME"/.cache/ags/user/generated/gradience/preset.json
        done
        # Replace all instances of colour
        sed -i "s/{{ ${colorlist[$i]} }}/${colorvalues[$i]}/g" "$HOME"/.cache/ags/user/generated/gradience/preset.json
    done

    mkdir -p "$HOME/.config/presets" # create gradience presets folder
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
    ags run-js 'openColorScheme.value = true; Utils.timeout(2000, () => openColorScheme.value = false);'
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

    # Apply colors
    for i in "${!colorlist[@]}"; do
        sed -i "s/{{ ${colorlist[$i]} }}/${colorvalues[$i]#\#}/g" "$HOME"/.cache/ags/user/generated/slurp/args.txt
    done

    mkdir -p "$HOME"/.config/slurp/
    cp "$HOME"/.cache/ags/user/generated/slurp/args.txt "$HOME"/.config/slurp/args.txt
}

if [[ "$1" = "--bad-apple" ]]; then
    lightdark=$(get_light_dark)
    cp scripts/color_generation/specials/_material_badapple"${lightdark}".scss scss/colour/generated.scss
    colornames=$(cat scripts/color_generation/specials/_material_badapple"${lightdark}".scss | cut -d: -f1)
    colorstrings=$(cat scripts/color_generation/specials/_material_badapple"${lightdark}".scss | cut -d: -f2 | cut -d ' ' -f2 | cut -d ";" -f1)
    IFS=$'\n'
    colorlist=( $colornames ) # Array of color names
    colorvalues=( $colorstrings ) # Array of color values
else
    colornames=$(cat scss/colour/generated.scss | cut -d: -f1)
    colorstrings=$(cat scss/colour/generated.scss | cut -d: -f2 | cut -d ' ' -f2 | cut -d ";" -f1)
    IFS=$'\n'
    colorlist=( $colornames ) # Array of color names
    colorvalues=( $colorstrings ) # Array of color values
fi

apply_ags &
apply_hyprland &
apply_hyprlock &
apply_gtk &
apply_fuzzel &
apply_term &
apply_slurp &
