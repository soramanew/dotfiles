#!/bin/bash

chosen_item=$(cliphist list | fuzzel --dmenu)

if [ -z "$chosen_item" ]; then
    echo "No chosen item"
    exit 0
fi

echo "$chosen_item" | cliphist decode | wl-copy
