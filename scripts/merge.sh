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

# Pull changes including submodule changes
output 'Pulling changes from remote...'
git pull --recurse-submodules

# Merge without committing or fast forward
output 'Starting merge...'
git merge --no-commit --no-ff $argv

# Revert file changes
output 'Reverting files...'
for pathspec in \
        pkglist.txt \
        stow/wlogout/.config/wlogout/style.css \
        stow/hypr/.config/hypr/hyprland/specific.conf
    git reset HEAD $pathspec
    git checkout -- $pathspec
end

# Need to reload config cause Hyprland detects changes when merge but not when revert files
output 'Reloading Hyprland config...'
hyprctl reload

output 'Done!'
