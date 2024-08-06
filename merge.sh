#!/bin/fish

cd (dirname (status -f)) || exit

function output -a text no_newline
    set_color --bold cyan
    [ -n "$no_newline" ] && echo -n ":: $text" || echo ":: $text"
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

output 'Reverting files...'

# Revert file changes
for pathspec in \
        .others/pkglist.txt \
        wallpapers/Pictures/Wallpapers \
        wlogout/.config/wlogout/style.css \
        ags/.config/ags/scss/_specific.scss \
        hypr/.config/hypr/hyprland/specific.conf
    git reset HEAD $pathspec
    git checkout -- $pathspec
end

output 'Finished merge.'
