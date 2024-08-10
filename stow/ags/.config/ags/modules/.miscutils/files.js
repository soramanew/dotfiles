import Gio from "gi://Gio";
import GLib from "gi://GLib";

export const fileExists = filePath => Gio.File.new_for_path(filePath).query_exists(null);

export const expandTilde = path => (path.startsWith("~") ? GLib.get_home_dir() + path.slice(1) : path);
