#!/bin/fish

cd (dirname (status filename)) || exit
cd ../.. || exit  # Move to project root

# User to set as owner (for easy debugging)
[ -n "$argv[1]" ] && set perm $argv[1] || set perm greeter

# Source utils file
. scripts/_util.sh

# Sync config
sudo-push greeter /etc/greetd

# Create cache dir tmpfile config
echo "d /var/cache/greeter - $perm $perm - -" | sudo tee /etc/tmpfiles.d/greeter.conf
echo "d /var/cache/greeter/faces - $perm $perm - -" | sudo tee -a /etc/tmpfiles.d/greeter.conf

# Add user faces tmpfile config
for user in (find /home -maxdepth 1 -mindepth 1 -type d -not -name 'lost+found' -exec basename {} \;)
    if [ -f "/home/$user/.face" ]
        echo "C+ /var/cache/greeter/faces/$user - $perm $perm - $(realpath /home/$user/.face)" | sudo tee -a /etc/tmpfiles.d/greeter.conf
    end
end

# Copy cursor theme to system-wide if not same
sudo-push stow/theming/.icons/sweet-cursors /usr/share/icons/sweet-cursors

output 'Done!'
