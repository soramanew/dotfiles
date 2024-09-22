#!/bin/fish

cd (dirname (status filename)) || exit
cd ../.. || exit  # Move to project root

# Source utils file
. scripts/_util.sh

output 'Pulling changes...'
git pull --recurse-submodules

output 'Restowing dotfiles...'
./scripts/stow.sh -R

if test -d /etc/greetd/ags && test -d /etc/greetd/hypr
    output 'Updating greeter...'
    ./scripts/install/greeter.sh
end

if test -f /etc/pacman.d/hooks/90-backup-pkglist.hook && test -f /etc/pacman.d/hooks/91-backup-pkglist-$USER.hook
    output 'Updating pacman hooks...'
    ./scripts/install/pkglist-backup.sh
end

output 'Done!'
