#!/bin/fish

cd (dirname (status filename)) || exit
cd ../.. || exit  # Move to project root

# Source utils file
. scripts/_util.sh

# Clone repo
output 'Sparse-cloning nova branch of Sweet git repo...'
git clone -n --depth=1 --filter=tree:0 -b nova --single-branch https://github.com/EliverLara/Sweet.git temp
cd temp
git sparse-checkout set --no-cone kde/cursors/Sweet-cursors
git checkout

# Push to theming
push kde/cursors/Sweet-cursors ../stow/theming/.icons/sweet-cursors

# Delete temp folder
output 'Deleting temporary folder...'
cd ..
rm -rf temp

# Update system cursors (for greeter)
sudo-push stow/theming/.icons/sweet-cursors /usr/share/icons/sweet-cursors

output 'Done!'
