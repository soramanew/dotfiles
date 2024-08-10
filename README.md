# dotfiles

My dotfiles for Hyprland on Arch Linux.

> [!WARNING]
> These were made for personal use and may not work on other systems. Also, I make breaking changes quite often, so beware of updates.

## Installation

```sh
git clone --recurse-submodules https://github.com/soramanew/dotfiles.git
cat dotfiles/pkglist.txt | yay -S --needed -  # Or other AUR helper
cd dotfiles/stow
stow -t ~ */  # Optionally, stow individual folders for individual configs (not guaranteed to work cause interdependent stuff)

# Optionals
dotctl install greeter  # Frontend for greetd
dotctl install plymouth  # Plymouth theme
dotctl install arrpc  # arRPC for use with custom discord clients (Vesktop, Armcord, etc)
dotctl install shyfox [ <PROFILE> ]  # ShyFox firefox theme, optionally specify profile
dotctl install pkglist-backup  # Pacman hooks to back up packages to /etc/pkglist.txt and dotfiles directory
```

On conflicts, remove files or use the `--adopt` flag to use existing files.

## Usage

```sh
# Update
git pull --recurse-submodules
dotctl stow -R

# Remove
dotctl stow -D

# Add greeter background
sudo cp <FILE> /etc/greetd/ags/backgrounds/
```
