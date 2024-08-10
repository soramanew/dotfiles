#!/bin/fish

mkdir -p ~/.cache/ags/logs/
ags &> ~/.cache/ags/logs/$(date '+%Y%m%d_%H-%M-%S').log
