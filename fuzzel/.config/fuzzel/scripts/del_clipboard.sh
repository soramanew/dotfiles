#!/bin/bash

chosen_item=$(cliphist list | fuzzel --dmenu --prompt="del >>  ")

if [ -z "$chosen_item" ]; then
    echo "No chosen item"
    exit 0
fi

echo "$chosen_item" | cliphist delete
