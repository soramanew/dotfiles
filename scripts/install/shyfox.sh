#!/bin/fish

cd (dirname (status filename)) || exit
cd ../.. || exit  # Move to project root

# Profile to install shyfox to
[ -n "$argv[1]" ] && set profile $argv[1] || set profile default-release

# Source utils file
. scripts/_util.sh

output "Symlinking ShyFox chrome/ and user.js to firefox $profile..."
ln -sf (realpath others/ShyFox/chrome) ~/.mozilla/firefox/*.$profile/chrome
ln -sf (realpath others/ShyFox/user.js) ~/.mozilla/firefox/*.$profile/user.js

output 'Done!'
