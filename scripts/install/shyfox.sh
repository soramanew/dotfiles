#!/bin/fish

cd (dirname (status filename)) || exit
cd ../.. || exit  # Move to project root

# Profile to install shyfox to
[ -n "$argv[1]" ] && set profile $argv[1] || set profile default-release

# Source utils file
. scripts/_util.sh

set profile_paths (find ~/.mozilla/firefox -type d -name '*.'$profile)
if ! count $profile_paths >/dev/null
    output "Unable to get path for $profile. Exiting."
    exit 1
end

for profile_path in $profile_paths
    set -l pp_stripped (basename $profile_path)
    output "Installing ShyFox to $pp_stripped..."

    if [ -L "$profile_path/chrome" ]
        output "Existing $pp_stripped/chrome found. Deleting..."
        rm -r $profile_path/chrome
    end

    if [ -L "$profile_path/user.js" ]
        output "Existing $pp_stripped/user.js found. Deleting..."
        rm $profile_path/user.js
    end

    output "Symlinking ShyFox chrome/ and user.js to $pp_stripped..."
    ln -s (realpath firefox/ShyFox/chrome) $profile_path/chrome
    ln -s (realpath firefox/ShyFox/user.js) $profile_path/user.js
end

output 'Done!'
