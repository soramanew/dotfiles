#!/bin/bash

storage_dir=~/Videos/Recordings
cache_dir=~/.cache/record_script

mkdir -p "$storage_dir"
mkdir -p "$cache_dir"

file_ext='.mp4'
recording_path="${cache_dir}/recording${file_ext}"
file_name=$(basename "$0")

if pgrep wf-recorder > /dev/null; then
    pkill wf-recorder &
    new_recording_path="${storage_dir}/recording_$(date '+%Y%m%d_%H-%M-%S')${file_ext}"
    mv "$recording_path" "$new_recording_path"
    action=$(notify-send "Recording stopped" "Stopped recording $new_recording_path" -a "$file_name" --action='watch=Watch' --action='open=Open' --action='save=Save As')
    ags -r 'closeEverything();'
    case $action in
        'watch')
            xdg-open "$new_recording_path" & disown
            ;;
        'open')
        	dbus-send --session --dest=org.freedesktop.FileManager1 --type=method_call /org/freedesktop/FileManager1 org.freedesktop.FileManager1.ShowItems array:string:"file://$new_recording_path" string:"" || xdg-open $(dirname "$new_recording_path") & disown
        	;;
        'save')
        	save_file=$(zenity --file-selection --save --title='Save As')
        	if [ -n "$save_file" ]; then
            	mv "$new_recording_path" "$save_file"
            else
        		echo "No file selected"
        	fi
        	;;
        *)
            echo "Unknown action: $action"
            ;;
    esac
else
    if [[ "$1" == "--sound" ]]; then
        wf-recorder -x yuv420p -f "$recording_path" -g "$(slurp)" -a & disown
    elif [[ "$1" == "--fullscreen-sound" ]]; then
        wf-recorder -x yuv420p -f "$recording_path" -a & disown
    elif [[ "$1" == "--fullscreen" ]]; then
        wf-recorder -x yuv420p -f "$recording_path" & disown
    else 
        wf-recorder -x yuv420p -f "$recording_path" -g "$(slurp)" & disown
    fi
    notify-send "Recording started" "Recording..." -a "$file_name"
fi

