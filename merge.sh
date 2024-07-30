#!/bin/fish

cd (dirname (status -f)) || exit

# Merge without committing or fast forward
git merge --no-commit --no-ff $argv[1]

# Revert file changes
set exclude .others/pkglist.txt ags/.config/ags/scripts/templates/fuzzel/ fuzzel/.config/fuzzel/fuzzel.ini wlogout/.config/wlogout/style.css ags/.config/ags/scss/_bar.scss
for pathspec in $exclude
    git reset HEAD $pathspec
    git checkout -- $pathspec
end
