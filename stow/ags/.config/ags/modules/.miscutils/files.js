import Gio from "gi://Gio";

export const fileExists = filePath => Gio.File.new_for_path(filePath).query_exists(null);

export const expandTilde = path => (path.startsWith("~") ? Utils.HOME + path.slice(1) : path);

export const getFileIcon = fileInfo => {
    let icon = fileInfo.get_icon();
    return icon ? icon.get_names()[0] : "text-x-generic"; // Default icon for files
};

export function ls({ path = "~", silent = false }) {
    let contents = [];
    try {
        let expandedPath = expandTilde(path);
        if (expandedPath.endsWith("/")) expandedPath = expandedPath.slice(0, -1);
        let folder = Gio.File.new_for_path(expandedPath);

        let enumerator = folder.enumerate_children("standard::*", Gio.FileQueryInfoFlags.NONE, null);
        let fileInfo;
        while ((fileInfo = enumerator.next_file(null)) !== null) {
            let fileName = fileInfo.get_display_name();
            let fileType = fileInfo.get_file_type();

            let item = {
                parentPath: expandedPath,
                name: fileName,
                type: fileType === Gio.FileType.DIRECTORY ? "folder" : "file",
                icon: getFileIcon(fileInfo),
            };

            // Add file extension for files
            if (fileType === Gio.FileType.REGULAR) {
                let fileExtension = fileName.split(".").pop();
                item.type = `${fileExtension}`;
            }

            contents.push(item);
            contents.sort((a, b) => {
                const aIsFolder = a.type.startsWith("folder");
                const bIsFolder = b.type.startsWith("folder");
                if (aIsFolder && !bIsFolder) {
                    return -1;
                } else if (!aIsFolder && bIsFolder) {
                    return 1;
                } else {
                    return a.name.localeCompare(b.name); // Sort alphabetically within folders and files
                }
            });
        }
    } catch (e) {
        if (!silent) console.log(e);
    }
    return contents;
}

export const openFile = path =>
    Utils.execAsync([
        "bash",
        "-c",
        `dbus-send --session --dest=org.freedesktop.FileManager1 --type=method_call /org/freedesktop/FileManager1 org.freedesktop.FileManager1.ShowItems array:string:"file://${path}" string:"" || xdg-open "${path}"`,
    ]).catch(print);
