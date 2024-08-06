# dotfiles

### My dotfiles for Hyprland on Arch Linux

Clone the repo using:

```sh
git clone --recurse-submodules https://github.com/soramanew/dotfiles.git
```

Update the repo using:

```sh
git pull --recurse-submodules
```

To use vesktop arRPC:

```sh
cd vesktop/.config/vesktop/arrpc
npm install
systemctl --user enable arrpc.service --now
```

ShyFox firefox theme:

```sh
ln -s "$(realpath .others/ShyFox/chrome)" ~/.mozilla/<PROFILE>/
ln -s "$(realpath .others/ShyFox/user.js)" ~/.mozilla/<PROFILE>/
```
