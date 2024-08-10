# dotfiles

### My dotfiles for Hyprland on Arch Linux

Usage:

```sh
# On install
cd stow
stow -t ~ */
# Update
dotctl stow -R
# Remove
dotctl stow -D
```

Clone the repo using:

```sh
git clone --recurse-submodules https://github.com/soramanew/dotfiles.git
```

Update the repo using:

```sh
git pull --recurse-submodules
```

Greeter:

```sh
dotctl install greeter
```

Add greeter backgrounds:

```sh
sudo cp <FILE> /etc/greetd/ags/backgrounds/
```

Plymouth:

```sh
dotctl install plymouth
```

To use vesktop arRPC:

```sh
dotctl install arrpc
```

To use ShyFox firefox theme:

```sh
dotctl install shyfox <PROFILE>
```

To update icon theme:

```sh
dotctl update icons
```

To update cursor theme:

```sh
dotctl update cursors
```
