#!/bin/bash

# Save prev options
damage_tracking=$(hyprctl getoption debug:damage_tracking -j | jq -r '.int')
screen_shader=$(hyprctl getoption decoration:screen_shader -j | jq -r '.str')

# Enable drugs shader
hyprctl keyword debug:damage_tracking 0
hyprctl keyword decoration:screen_shader ~/.config/hypr/shaders/drugs.frag

# Reset to prev options when killed
reset() {
    hyprctl keyword debug:damage_tracking "$damage_tracking"
    hyprctl keyword decoration:screen_shader "$screen_shader"
}
trap reset EXIT

# Sleep until killed
sleep infinity
