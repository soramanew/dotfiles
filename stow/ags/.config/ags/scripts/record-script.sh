#!/bin/fish

function output -a text
    set_color cyan
    # Pass arguments other than text to echo
    echo $argv[2..] -- ":: $text"
    set_color normal
end

function get-audio-source
    pactl list sources | grep 'Name' | grep 'monitor' | cut -d ' ' -f2
end

function get-active-monitor
    hyprctl monitors -j | jq -r '.[] | select(.focused == true) | .name'
end

function has-gpu
    test -e /dev/dri/renderD128
end

function supports-codec -a codec
    ffmpeg -hide_banner -encoders | grep -E '^ V' | grep -F '(codec' | grep $codec >/dev/null
end

function supports-gpu-codecs
    supports-codec hevc_vaapi || supports-codec h264_vaapi
end

set storage_dir ~/Videos/Recordings
set cache_dir ~/.cache/record_script

mkdir -p $storage_dir
mkdir -p $cache_dir

set file_ext 'mp4'
set recording_path "$cache_dir/recording.$file_ext"
set notif_id_path "$cache_dir/notifid.txt"
set script_name (basename (status filename))

argparse -n $script_name -X 0 \
    'h/help' \
    's/sound' \
    'r/region=?' \
    'c/compression=!_validate_int' \
    'H/hwaccel' \
    -- $argv
or exit

if set -q _flag_h
    echo 'Usage:'
    echo '    '$script_name' ( -h | --help )'
    echo '    '$script_name' [ -s | --sound ] [ -r | --region ] [ -c | --compression ] [ -H | --hwaccel ]'
    echo
    echo 'Options:'
    echo '    -h, --help                        Print this help message and exit'
    echo '    -s, --sound                       Enable audio capturing'
    echo '    -r, --region [ <region> ]         The region to capture, current monitor if option not given, default region slurp'
    echo '    -c, --compression <compression>   Use given compression level, lower = better quality, higher = better compression'
    echo '    -H, --hwaccel                     Use hardware acceleration if available'

    exit
end

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
        	test -n "$save_file" && mv $new_recording_path $save_file || output 'No file selected'
        case '*'
            test -z "$action" || output "Unknown action: $action"
    end
else
    # Set region if flag given otherwise active monitor
    if set -q _flag_r
        # Use given region if value otherwise slurp
        set region -g (test -n "$_flag_r" && echo $_flag_r || slurp)

        # No hardware encoding when smaller than 256x128 cause unsupported
        if set -q _flag_H
            set -l size (echo $region[2] | string split -n -f 2 ' ' | string split x)
            if test $size[1] -lt 256 -o $size[2] -lt 128
                output 'Hardware encoding unsupported below size 256x128. Falling back to software encoding.'
                set -e _flag_H
            end
        end
    else
        set region -o (get-active-monitor)
    end

    # Sound if enabled
    set -q _flag_s && set audio --audio=(get-audio-source)

    # Codec stuff
    if set -q _flag_H && has-gpu && supports-gpu-codecs
        # Hardware encoding (GPU)
        supports-codec hevc_vaapi && set codec hevc_vaapi || set codec h264_vaapi
        set -q _flag_c && set compression -p qp=$_flag_c -p rc_mode=CQP
        set codec_flags -d /dev/dri/renderD128
    else
        # Software encoding (CPU)
        set -q _flag_H && output 'Unable to use hardware acceleration. Falling back to software encoding.'
        supports-codec libx265 && set codec libx265 || set codec libx264
        set -q _flag_c && set compression -p crf=$_flag_c
        set codec_flags -x yuv420p
    end

    wf-recorder -c $codec $codec_flags $compression $region $audio -f $recording_path & disown

    notify-send 'Recording started' 'Recording...' -a $script_name -p > $notif_id_path
end
