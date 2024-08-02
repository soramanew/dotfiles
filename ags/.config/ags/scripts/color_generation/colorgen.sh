#!/usr/bin/env bash

# check if no arguments
if [ $# -eq 0 ]; then
    echo "Usage: colorgen.sh /path/to/image (--apply)"
    exit 1
fi

colourmodefile="$HOME/.cache/ags/user/colormode.txt"
lightdark="dark"
transparency="opaque"
materialscheme="vibrant"
terminalscheme="$HOME/.config/ags/scripts/templates/terminal/scheme-base.json"
backend="material"  # Colour generator backend

if [ ! -f $colourmodefile ]; then
    echo "dark" > $colourmodefile
    echo "opaque" >> $colourmodefile
    echo "vibrant" >> $colourmodefile
elif [[ $(wc -l < $colourmodefile) -ne 3 || $(wc -w < $colourmodefile) -ne 3 ]]; then
    echo "dark" > $colourmodefile
    echo "opaque" >> $colourmodefile
    echo "vibrant" >> $colourmodefile
else
    lightdark=$(sed -n '1p' $colourmodefile)
    transparency=$(sed -n '2p' $colourmodefile)
    materialscheme=$(sed -n '3p' $colourmodefile)
    if [ "$materialscheme" = "monochrome" ]; then
      terminalscheme="$HOME/.config/ags/scripts/templates/terminal/scheme-monochrome.json"
    fi
fi

if [ ! -f "$HOME/.cache/ags/user/colorbackend.txt" ]; then
    echo "material" > "$HOME/.cache/ags/user/colorbackend.txt"
else
    backend=$(cat "$HOME/.cache/ags/user/colorbackend.txt")
fi

cd "$HOME/.config/ags/scripts/" || exit
if [[ "$1" = "#"* ]]; then  # Argument is a colour
    color_generation/generate_colors_material.py --color "$1" \
    --mode "$lightdark" --scheme "$materialscheme" --transparency "$transparency" \
    --termscheme $terminalscheme --blend_bg_fg \
    > "$HOME"/.cache/ags/user/generated/material_colors.scss
    if [ "$2" = "--apply" ]; then
        cp "$HOME"/.cache/ags/user/generated/material_colors.scss "$HOME/.config/ags/scss/_material.scss"
        color_generation/applycolor.sh
    fi
elif [ "$backend" = "material" ]; then
    smartflag=''
    if [ "$3" = "--smart" ]; then
        smartflag='--smart'
    fi
    color_generation/generate_colors_material.py --path "$1" \
    --mode "$lightdark" --scheme "$materialscheme" --transparency "$transparency" \
    --termscheme $terminalscheme --blend_bg_fg \
    --cache "$HOME/.cache/ags/user/color.txt" $smartflag \
    > "$HOME"/.cache/ags/user/generated/material_colors.scss
    if [ "$2" = "--apply" ]; then
        cp "$HOME"/.cache/ags/user/generated/material_colors.scss "$HOME/.config/ags/scss/_material.scss"
        color_generation/applycolor.sh
    fi
elif [ "$backend" = "pywal" ]; then
    # clear and generate
    wal -c
    wal -i "$1" -n $lightdark -q
    # copy scss
    cp "$HOME/.cache/wal/colors.scss" "$HOME"/.cache/ags/user/generated/material_colors.scss

    cat color_generation/pywal_to_material.scss >> "$HOME"/.cache/ags/user/generated/material_colors.scss
    if [ "$2" = "--apply" ]; then
        sass "$HOME"/.cache/ags/user/generated/material_colors.scss "$HOME"/.cache/ags/user/generated/colors_classes.scss --style compact
        sed -i "s/ { color//g" "$HOME"/.cache/ags/user/generated/colors_classes.scss
        sed -i "s/\./$/g" "$HOME"/.cache/ags/user/generated/colors_classes.scss
        sed -i "s/}//g" "$HOME"/.cache/ags/user/generated/colors_classes.scss
        if [ "$lightdark" = "-l" ]; then
            printf "\n""\$darkmode: false;""\n" >> "$HOME"/.cache/ags/user/generated/colors_classes.scss
        else
            printf "\n""\$darkmode: true;""\n" >> "$HOME"/.cache/ags/user/generated/colors_classes.scss
        fi

        cp "$HOME"/.cache/ags/user/generated/colors_classes.scss "$HOME/.config/ags/scss/_material.scss"
        color_generation/applycolor.sh
    fi
fi