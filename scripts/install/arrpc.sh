#!/bin/fish

cd (dirname (status filename)) || exit
cd .. || exit

# Source utils file
. _util.sh

cd ../stow/vesktop/.config/vesktop/arrpc || exit

# Install deps and enable service
output 'Installing npm dependencies and enabling arRPC systemd user service...'
npm install
systemctl --user enable arrpc.service --now

output 'Done!'
