#!/bin/fish

cd (dirname (status filename)) || exit

# Source utils file
. ../_util.sh

# Move to ags config dir
cd ../../stow/ags/.config/ags || exit

# Clone repo
output 'Cloning MicroTex git repo...'
git clone https://github.com/NanoMichael/MicroTeX.git microtex
cd microtex

# Build
output 'Building MicroTex...'
cmake -B build -S . -DCMAKE_BUILD_TYPE=None -DHAVE_LOG=OFF -DGRAPHICS_DEBUG=OFF
cmake --build build -j

output 'Done!'
