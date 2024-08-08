#!/bin/fish

cd (dirname (status -f)) || exit

function output -a text
    set_color --bold cyan
    # Pass arguments other than text to echo
    echo $argv[2..] -- ":: $text"
    set_color normal
end

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
        .others/pkglist.txt \
        wlogout/.config/wlogout/style.css \
        hypr/.config/hypr/hyprland/specific.conf
    git reset HEAD $pathspec
    git checkout -- $pathspec
end

# Need to reload config cause Hyprland detects changes when merge but not when revert files
ouput 'Reloading Hyprland config...'
hyprctl reload

ouput 'Done!'
