#!/bin/fish

cd (dirname (status filename))/.. || exit

set profile_path
function get-profile
    set profile_path (find ~/.mozilla/firefox -type d -name '*.whatsapp')[1]
end

# Source utils file
. _util.sh

set config_opt 'user_pref("full-screen-api.ignore-widgets", true);'

# Check for existing whatsapp profile
get-profile
if test -f "$profile_path/user.js" -a "$(cat $profile_path/user.js)" != $config_opt
    output "Whatsapp profile with user.js already exists at path: $profile_path"
    output 'Please remove the user.js file before retrying, or add `'$config_opt'` to it manually.'
    exit 1
end

# Create profile
get-profile
if test -z "$profile_path"
    output 'Creating whatsapp profile...'
    firefox --CreateProfile whatsapp
    get-profile
else
    output 'Whatsapp profile already exists. Using existing profile.'
end

output "Installing config options to $profile_path/user.js..."
echo $config_opt > $profile_path/user.js

if ! jq -e '.addons[] | select(.id == "{d320c473-63c2-47ab-87f8-693b1badb5e3}")' $profile_path/addons.json >/dev/null
    output 'Please install https://addons.mozilla.org/en-US/firefox/addon/autofullscreen manually.'
    firefox -P whatsapp https://addons.mozilla.org/en-US/firefox/addon/autofullscreen
end

output 'Done!'
