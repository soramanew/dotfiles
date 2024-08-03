#!/bin/fish

cd (dirname (status -f)) || exit

function colour_echo -a text
    set_color --bold cyan
    echo "$text"
    set_color normal
end

if [ (git status --porcelain) ]
    read -l -p "colour_echo ':: You have unstashed changes. Proceed with merge? [y/N] '" confirm
    if [ "$confirm" != 'y' -a "$confirm" != 'Y' ]
        colour_echo 'Exiting.'
        exit
    end
end

colour_echo 'Starting merge...'

# Merge without committing or fast forward
git merge --no-commit --no-ff $argv[1]

colour_echo 'Reverting files...'

# Revert file changes
for pathspec in \
        .others/pkglist.txt \
        wlogout/.config/wlogout/style.css \
        ags/.config/ags/scss/_specific.scss \
        hypr/.config/hypr/hyprland/specific.conf
    git reset HEAD $pathspec
    git checkout -- $pathspec
end

colour_echo 'Finished merge.'
