#!/bin/fish

cd (dirname (status filename)) || exit
cd ../.. || exit  # Move to project root

# Source utils file
. scripts/_util.sh

# Clone repo
output 'Sparse-cloning Sweet-folders git repo...'
git clone -n --depth=1 --filter=tree:0 https://github.com/EliverLara/Sweet-folders.git temp
cd temp
git sparse-checkout set --no-cone Sweet-Rainbow
git checkout

# Push to theming
push Sweet-Rainbow ../stow/theming/.icons/sweet-rainbow

# Delete temp folder
output 'Deleting temporary folder...'
cd ..
rm -rf temp

output 'Done!'
