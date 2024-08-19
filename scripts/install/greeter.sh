#!/bin/fish

cd (dirname (status filename)) || exit
cd ../.. || exit  # Move to project root

# User to set as owner (for easy debugging)
[ -n "$argv[1]" ] && set perm $argv[1] || set perm greeter

# Source utils file
. scripts/_util.sh

# Sync config
sudo-push greeter /etc/greetd

set greeter_cache /var/cache/greeter
set face_cache $greeter_cache/faces
set tmpfile_conf /etc/tmpfiles.d/greeter.conf

# Create cache dir tmpfile config
echo "d $greeter_cache - $perm $perm - -" | sudo tee $tmpfile_conf
echo "d $face_cache - $perm $perm - -" | sudo tee -a $tmpfile_conf

# Add user faces tmpfile config
for user in (find /home -maxdepth 1 -mindepth 1 -type d -not -name 'lost+found' -exec basename {} \;)
    if [ -f "/home/$user/.face" ]
        echo "C $face_cache/$user - $perm $perm - $(realpath /home/$user/.face)" | sudo tee -a $tmpfile_conf
        [ -f "$face_cache/$user" ] && sudo rm $face_cache/$user
    end
end

# Execute tmpfiles config
sudo systemd-tmpfiles --create $tmpfile_conf

# Change ownership of all existing files in cache
sudo chown $perm:$perm $greeter_cache/**

# Copy cursor theme to system-wide if not same
sudo-push stow/theming/.icons/sweet-cursors /usr/share/icons/sweet-cursors

output 'Done!'
