#!/bin/fish

cd (dirname (status -f)) || exit

# Merge without committing or fast forward
git merge --no-commit --no-ff $argv[1]

# Revert file changes
for pathspec in \
        .others/pkglist.txt \
        wlogout/.config/wlogout/style.css \
        ags/.config/ags/scss/_specific.scss \
        hypr/.config/hypr/hyprland/specific.conf
    git reset HEAD $pathspec
    git checkout -- $pathspec
end
