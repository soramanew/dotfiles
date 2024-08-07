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

output 'Starting merge...'

# Merge without committing or fast forward
git merge --no-commit --no-ff $argv[1]

# Revert file changes
output 'Reverting files...'
for pathspec in \
        .others/pkglist.txt \
        wlogout/.config/wlogout/style.css \
        ags/.config/ags/scss/_specific.scss \
        hypr/.config/hypr/hyprland/specific.conf
    git reset HEAD $pathspec
    git checkout -- $pathspec
end

# Need to reload config cause Hyprland detects changes when merge but not when revert files
ouput 'Reloading Hyprland config...'
hyprctl reload

output 'Finished merge.'
