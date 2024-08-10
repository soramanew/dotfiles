#!/bin/bash

export WAYLAND_DISPLAY=wayland-1
export XDG_RUNTIME_DIR=/run/user/1000

if [ "$1" = 'enable' ]; then
    rot8 &
    pgrep ags && ags -r 'tabletMode.value = true;'
elif [ "$1" = 'disable' ]; then
    killall rot8
    wlr-randr --output eDP-1 --transform normal
    pgrep ags && ags -r 'App.closeWindow("osk"); tabletMode.value = false;'
else
    logger -t "$0" "Unknown command: $1"
fi
