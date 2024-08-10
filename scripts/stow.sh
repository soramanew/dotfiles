#!/bin/fish

cd (dirname (status filename)) || exit
cd ../stow || exit

stow $argv -t ~ */
