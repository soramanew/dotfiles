#!/bin/fish

function get-audio-source
    pactl list sources | grep 'Name' | grep 'monitor' | cut -d ' ' -f2
end

function get-active-monitor
    hyprctl monitors -j | jq -r '.[] | select(.focused == true) | .name'
end

set storage_dir ~/Videos/Recordings
set cache_dir ~/.cache/record_script

mkdir -p $storage_dir
mkdir -p $cache_dir

set file_ext 'mp4'
set recording_path "$cache_dir/recording.$file_ext"
set notif_id_path "$cache_dir/notifid.txt"
set script_name (basename (status filename))

argparse -n $script_name -X 0 -x 's,f,S' -x 'c,C' \
    's/sound' \
    'f/fullscreen' \
    'S/fullscreen-sound' \
    'c/no-compression' \
    'C/less-compression' \
    -- $argv
or exit

if pgrep wf-recorder >/dev/null
    pkill wf-recorder

    # Move to recordings folder
    set -l new_recording_path "$storage_dir/recording_$(date '+%Y%m%d_%H-%M-%S').$file_ext"
    mv $recording_path $new_recording_path

    # Close start notification
    if test -f $notif_id_path
        gdbus call --session \
            --dest org.freedesktop.Notifications \
            --object-path /org/freedesktop/Notifications \
            --method org.freedesktop.Notifications.CloseNotification \
            (cat $notif_id_path)
    end

    # Notification with actions
    set -l action (notify-send 'Recording stopped' "Stopped recording $new_recording_path" -a $script_name --action='watch=Watch' --action='open=Open' --action='save=Save As')

    switch $action
        case 'watch'
            ags -r 'closeEverything();' >/dev/null
            xdg-open $new_recording_path
        case 'open'
            ags -r 'closeEverything();' >/dev/null
        	dbus-send --session --dest=org.freedesktop.FileManager1 --type=method_call /org/freedesktop/FileManager1 org.freedesktop.FileManager1.ShowItems array:string:"file://$new_recording_path" string:'' \
                || xdg-open (dirname $new_recording_path)
        case 'save'
            ags -r 'closeEverything();' >/dev/null
        	set -l save_file (zenity --file-selection --save --title='Save As')
        	test -n "$save_file" && mv $new_recording_path $save_file || echo 'No file selected'
        case '*'
            echo "Unknown action: $action"
    end
else
    # Region (default)
    set -l region

    # Region sound
    if set -q _flag_s
        set audio
    end

    # Fullscreen
    if set -q _flag_f
        set -e region
    end

    # Fullscreen sound
    if set -q _flag_S
        set -e region
        set audio
    end

    # Compression
    if ! set -q _flag_c
        set -q _flag_C && set compression 26 || set compression 28
        set compression -p crf=$compression
    end

    set -q region && set region -g (slurp) || set region -o (get-active-monitor)
    set -q audio && set audio --audio=(get-audio-source)
    wf-recorder -x yuv420p -c libx265 $compression $region $audio -f $recording_path & disown

    notify-send 'Recording started' 'Recording...' -a $script_name -p > $notif_id_path
end
