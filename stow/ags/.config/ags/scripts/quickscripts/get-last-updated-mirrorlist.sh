#!/bin/bash

finished_pattern="# FINISHED AT: "
last_updated=$(grep "$finished_pattern" /etc/pacman.d/mirrorlist | sed "s/$finished_pattern//")
diff_st=$(($(date +%s) - $(date -d "$last_updated" +%s)))
diff_s=$((diff_st % 60))
diff_m=$((diff_st / 60 % 60))
diff_h=$((diff_st / 60 / 60 % 24))
diff_d=$((diff_st / 60 / 60 / 24))

[ $diff_d -gt 0 ] && ([ $diff_d -gt 1 ] && printf "%d days and " $diff_d || printf "1 day and ")
[ $diff_h -gt 0 ] && ([ $diff_h -gt 1 ] && printf "%d hours" $diff_h || printf "1 hour")

if [[ $diff_d -le 0 && $diff_h -le 0 ]]; then
    [ $diff_m -gt 0 ] && printf "%dmin and " $diff_m
    printf "%ds" $diff_s
fi
