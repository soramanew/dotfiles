#!/bin/fish

cd (dirname (status filename)) || exit
cd ../.. || exit  # Move to project root

# Source utils file
. scripts/_util.sh

# Sync config
sudo-push plymouth /usr/share/plymouth/themes/circle

# Set theme as default
sudo plymouth-set-default-theme circle

output 'Done!'
