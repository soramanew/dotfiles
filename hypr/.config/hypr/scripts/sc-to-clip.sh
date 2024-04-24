#!/bin/fish

set tmp_file "$HOME/.cache/sc_notifs/$(date +'%Y%m%d%H%M%S')"
mkdir -p (dirname $tmp_file)
grim $argv $tmp_file; and wl-copy < $tmp_file; or exit 1

set notif_header 'Screenshot taken'
set notif_content "Screenshot stored in $tmp_file and copied to clipboard"
set overwrite_warning '<span size="x-large">Are you sure you want to overwrite this file?</span>'
set open_action 'open'
set save_action 'save'

set action (notify-send -i $tmp_file -a (basename (status current-filename)) --action="$open_action=Open" --action="$save_action=Save" $notif_header $notif_content)
switch $action
    case $open_action
        ags -r 'closeEverything();'
        swappy -f $tmp_file & disown
    case $save_action
        ags -r 'App.closeWindow("sideright");'
        set save_file (zenity --file-selection --save --title='Save As')
        [ -z $save_file ] && exit 0
        if [ -f $save_file ]
            yad --image='abrt' --title='Warning!' --text-align=center --buttons-layout=center --borders=20 --text=$overwrite_warning || exit 0
        end
        cp -f $tmp_file $save_file
    case '*'
        echo "Invalid action: $action"
end
