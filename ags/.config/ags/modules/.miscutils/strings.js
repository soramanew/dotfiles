const invisUnicode = ["\u{061c}", "\u{200b}", "\u{200c}", "\u{200d}", "\u{200e}", "\u{200f}"];

export const stripInvisUnicode = str => {
    if (!str) return "";
    for (const unicode of invisUnicode) str = str.replaceAll(unicode, "");
    return str;
};
