#!/bin/fish

cd (dirname (status filename)) || exit
cd ../.. || exit  # Move to project root

# Profile to install shyfox to
[ -n "$argv[1]" ] && set profile $argv[1] || set profile default-release

# Source utils file
. scripts/_util.sh

set profile_path (find ~/.mozilla/firefox -type d -name '*.'$profile)[1]
if [ -z "$profile_path" ]
    output "Unable to get path for $profile. Exiting."
    exit 1
end

if [ -e "$profile_path/chrome" ]
    output "Existing $profile_path/chrome found. Deleting..."
    rm -r $profile_path/chrome
end

if [ -e "$profile_path/user.js" ]
    output "Existing $profile_path/user.js found. Deleting..."
    rm $profile_path/user.js
end

output "Symlinking ShyFox chrome/ and user.js to $profile_path..."
ln -s (realpath firefox/ShyFox/chrome) $profile_path/chrome
ln -s (realpath firefox/ShyFox/user.js) $profile_path/user.js

output 'Done!'
