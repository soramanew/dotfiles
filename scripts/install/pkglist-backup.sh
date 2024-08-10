#!/bin/fish

cd (dirname (status filename)) || exit
cd ../.. || exit  # Move to project root

count $argv >/dev/null && set users $argv || set users (find /home -maxdepth 1 -mindepth 1 -type d -not -name 'lost+found' -exec basename {} \;)

# Source utils file
. scripts/_util.sh

set hooks_dir /etc/pacman.d/hooks

output 'Creating system-wide package list backup hook...'
sudo cp -f scripts/_templates/pacman/backup-pkglist.hook $hooks_dir/90-backup-pkglist.hook

output "Creating user package list backup hook..."
set file $hooks_dir/91-backup-pkglist-$USER.hook
sudo cp -f scripts/_templates/pacman/backup-pkglist-user.hook $file
sudo sed -i 's|{{ $user }}|'$USER'|g' $file
sudo sed -i 's|{{ $dots_dir }}|'(pwd)'|g' $file

output 'Done!'
