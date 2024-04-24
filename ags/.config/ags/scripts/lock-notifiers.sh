#!/bin/bash

KEYBOARD=/dev/input/by-path/platform-i8042-serio-0-event-kbd
CAPS_EVENT="type 17 (EV_LED), code 1 (LED_CAPSL), value"
NUM_EVENT="type 17 (EV_LED), code 0 (LED_NUML), value"

evtest "$KEYBOARD" | while read line; do
    if [[ "$line" == *"$CAPS_EVENT 1" ]]; then
        ags -r "isCapsLockOn.value = true;"
    elif [[ "$line" == *"$CAPS_EVENT 0" ]]; then
        ags -r "isCapsLockOn.value = false;"
    elif [[ "$line" == *"$NUM_EVENT 1" ]]; then
        ags -r "isNumLockOn.value = true;"
    elif [[ "$line" == *"$NUM_EVENT 0" ]]; then
        ags -r "isNumLockOn.value = false;"
    fi
done
