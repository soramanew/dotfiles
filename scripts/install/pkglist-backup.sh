#!/bin/fish

cd (dirname (status filename)) || exit
cd ../.. || exit  # Move to project root

count $argv >/dev/null && set users $argv || set users (find /home -maxdepth 1 -mindepth 1 -type d -not -name 'lost+found' -exec basename {} \;)

# Source utils file
. scripts/_util.sh

set hooks_dir /etc/pacman.d/hooks
set priority 90
set dots_dir (pwd)

output 'Creating system-wide package list backup hook...'
sudo cp -f scripts/_templates/pacman/backup-pkglist.hook $hooks_dir/$priority-backup-pkglist.hook
for user in $users
    output "Creating package list backup hook for user $user..."
    set priority (math $priority + 1)
    set -l file $hooks_dir/$priority-backup-pkglist-$user.hook
    sudo cp -f scripts/_templates/pacman/backup-pkglist-user.hook $file
    sudo sed -i 's|{{ $user }}|'$user'|g' $file
    sudo sed -i 's|{{ $dots_dir }}|'$dots_dir'|g' $file
end

output 'Done!'
