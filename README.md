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

Greetd:

```sh
sudo rm -r /etc/greetd
sudo cp -r .others/greetd /etc/greetd
echo 'd /var/cache/greeter - greeter greeter - -' | sudo tee /etc/tmpfiles.d/greeter.conf
sudo cp -r theming/.icons/sweet-cursors /usr/share/icons/sweet-cursors
```

Change greetd background:

```sh
sudo cp -f <FILE> /etc/greetd/ags/assets/background
```

Plymouth:

```sh
sudo cp -r .others/plymouth/circle /usr/share/plymouth/themes/
sudo plymouth-set-default-theme circle
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
# Optionally, for greetd (system-wide)
sudo cp -r theming/.icons/sweet-cursors /usr/share/icons/sweet-cursors
```
