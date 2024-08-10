#!/bin/fish

cd (dirname (status filename)) || exit
cd ../.. || exit  # Move to project root

git submodule update --init --recursive --remote $argv
