#!/bin/fish

cd (dirname (status filename)) || exit
cd .. || exit

# Source utils file
. scripts/_util.sh

if [ (git status --porcelain) ]
    read -l -p "output 'You have unstashed changes. Proceed with merge? [y/N] ' -n" confirm
    if [ "$confirm" != 'y' -a "$confirm" != 'Y' ]
        output 'Exiting.'
        exit
    end
end

# Fetch changes
output 'Getting changes from remote...'
git fetch

# Merge without committing or fast forward
output 'Starting merge...'
git merge --no-commit --no-ff $argv

# Revert file changes
output 'Reverting files...'
for pathspec in \
        pkglist.txt \
        stow/hypr/.config/hypr/hyprland/specific.conf
    git reset HEAD $pathspec
    git checkout -- $pathspec
end

# Need to reload config cause Hyprland detects changes when merge but not when revert files
output 'Reloading Hyprland config...'
hyprctl reload

output 'Done!'
