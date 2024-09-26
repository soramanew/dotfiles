<h1 align="center">✦ Ultimate rice for Hyprland ✦</h1>

<div align="center">

![GitHub last commit](https://img.shields.io/github/last-commit/soramanew/dotfiles?style=for-the-badge&logo=archlinux&logoColor=%23C7C4D6&labelColor=%231B1B25&color=%23C1C1FF)
![GitHub repo size](https://img.shields.io/github/repo-size/soramanew/dotfiles?style=for-the-badge&logo=googledrive&logoColor=%23BAC9D1&labelColor=%23131D22&color=%2368D3FF)

</div>

> [!WARNING]
> These were made for personal use and may not work on other systems. Also, I make breaking changes quite often, so beware of updates.

## Features

-   Most of the features of [end_4's dots](https://github.com/end-4/dots-hyprland), except:
    -   AI sidebar (unnecessary bloat)
    -   Install scripts (forked a long time ago + too lazy to make)
    -   Easy config (because this was meant for personal use)
-   Greeter via AGS + Greetd
-   Fancy music osd
-   Package update indicator and view
-   Overview for windows and workspaces, including special workspaces and audio playing indicators
-   Window switcher via `Alt+Tab` if you are strange like that and need it
-   Notification categories by time
-   Todo screen with editable todos
-   Support for touchscreen devices (touchscreen toggle + auto rotate support)
-   Ultrawide mode (network and GPU usage indicators, bar weather)
-   Sexy lock screen
-   Randomly changing wallpaper
-   CLI control
-   Wallpaper picker
-   Also includes configs for a lot more things (firefox, mpv, etc)

### Greeter

![greeter](/readme/greeter.png?raw=true)

### Music OSD + Notification categories

![music osd](/readme/notifs+music.png?raw=true)

### Package updates view + Overview

![package updates view](/readme/packageupdates.png?raw=true)

### Window switcher

![window switcher](/readme/switcher.png?raw=true)

### Todo screen

![todo screen](/readme/todoscreen.png?raw=true)

### Wallpaper picker

![wallpaper picker](/readme/wallpicker.png?raw=true)

### Lock screen

![lock screen](/readme/lockscreen.png?raw=true)

## Requirements

-   `git-lfs` - for cloning

> [!TIP]
> You don't have to download the lfs objects, they are just wallpapers and readme images.
> You can skip them with
>
> ```sh
> GIT_LFS_SKIP_SMUDGE=1 git clone --recurse-submodules https://github.com/soramanew/dotfiles.git
> ```
>
> or by deleting the `.gitattributes` file.
>
> `git-lfs` is required if using the env var.

Just install the metapackages for end-4's dots for now, they should cover everything. I'll probably make some for my own later.
Or you can just install from the pkglist.txt file, which is guaranteed to cover everything but also has a lot of unnecessary packages.

```sh
# Installing from pkglist.txt
cat dotfiles/pkglist.txt | yay -S --needed -  # Or other AUR helper
```

## Installation

```sh
git clone --recurse-submodules https://github.com/soramanew/dotfiles.git
cd dotfiles/stow
stow -t ~ */  # Optionally, stow individual folders for individual configs (not guaranteed to work cause interdependent stuff)
systemctl --user enable ydotool.service --now  # For alternate paste
dotctl wallpaper change  # Generate colours and stuff, optionally specify a path to a wallpaper (-f /path/to/wallpaper)
# Then restart or copy ~/.config/hypr/hyprland/perf.template to ~/.config/hypr/hyprland/perf.conf

# Optionals
dotctl install greeter  # Frontend for greetd
dotctl install plymouth  # Plymouth theme
dotctl install arrpc  # arRPC for use with custom discord clients (Vesktop, Armcord, etc)
dotctl install shyfox [ <PROFILE> ]  # ShyFox firefox theme, optionally specify firefox profile
dotctl install whatsapp  # Whatsapp web app via firefox
dotctl install pkglist-backup  # Pacman hooks to back up packages to /etc/pkglist.txt and dotfiles directory
```

On conflicts, remove files or use the `--adopt` flag to use existing files.

## Usage

```sh
# Update
dotctl update dotfiles

# Updating dependencies
dotctl update ( cursors | icons | submodules )

# Remove
dotctl stow -D

# Change wallpaper
dotctl wallpaper change  # no opts for random, -h for options

# Add greeter background
sudo cp <FILE> /etc/greetd/ags/backgrounds/
```

## Credits

-   [end-4](https://github.com/end-4) 🙏 all the AGS stuff was originally forked from his
    [config](https://github.com/end-4/dots-hyprland) and is basically just an extension
-   [kotontrion](https://github.com/kotontrion/dotfiles) for the cava widget (music visualiser)

## Stargazers

[![Stargazers over time](https://starchart.cc/soramanew/dotfiles.svg?variant=adaptive)](https://starchart.cc/soramanew/dotfiles)
