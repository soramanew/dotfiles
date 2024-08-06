# dotfiles

### My dotfiles for Hyprland on Arch Linux

Usage:

```sh
# On install
stow */
# Update
stow -R */
# Remove
stow -D */
```

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

To use ShyFox firefox theme:

```sh
ln -s "$(realpath .others/ShyFox/chrome)" ~/.mozilla/firefox/<PROFILE>/
ln -s "$(realpath .others/ShyFox/user.js)" ~/.mozilla/firefox/<PROFILE>/
```

To update icon theme:

```sh
git clone -n --depth=1 --filter=tree:0 https://github.com/EliverLara/Sweet-folders.git temp
cd temp
git sparse-checkout set --no-cone Sweet-Rainbow
git checkout
mv Sweet-Rainbow ../theming/.icons/sweet-rainbow
cd ..
rm -rf temp
```

To update cursor theme:

```sh
git clone -n --depth=1 --filter=tree:0 -b nova --single-branch https://github.com/EliverLara/Sweet.git temp
cd temp
git sparse-checkout set --no-cone kde/cursors/Sweet-cursors
git checkout
mv kde/cursors/Sweet-cursors ../theming/.icons/sweet-cursors
cd ..
rm -rf temp
```
