// Converts from Markdown to Pango. This does not support code blocks.
// For illogical-impulse, code blocks are treated separately, in their own GtkSourceView widgets.
// Partly inherited from https://github.com/ubunatic/md2pango

const monospaceFonts =
    "JetBrains Mono NF, JetBrains Mono Nerd Font, JetBrains Mono NL, SpaceMono NF, SpaceMono Nerd Font, monospace";

const replacements = {
    indents: [
        { name: "BULLET", re: /^(\s*)([\*\-]\s)(.*)(\s*)$/, sub: " $1- $3" },
        { name: "NUMBERING", re: /^(\s*[0-9]+\.\s)(.*)(\s*)$/, sub: " $1 $2" },
    ],
    escapes: [
        { name: "COMMENT", re: /<!--.*-->/, sub: "" },
        { name: "AMPERSTAND", re: /&/g, sub: "&amp;" },
        { name: "LESSTHAN", re: /</g, sub: "&lt;" },
        { name: "GREATERTHAN", re: />/g, sub: "&gt;" },
    ],
    sections: [
        { name: "H1", re: /^(#\s+)(.*)(\s*)$/, sub: '<span font_weight="bold" size="170%">$2</span>' },
        { name: "H2", re: /^(##\s+)(.*)(\s*)$/, sub: '<span font_weight="bold" size="150%">$2</span>' },
        { name: "H3", re: /^(###\s+)(.*)(\s*)$/, sub: '<span font_weight="bold" size="125%">$2</span>' },
        { name: "H4", re: /^(####\s+)(.*)(\s*)$/, sub: '<span font_weight="bold" size="100%">$2</span>' },
        { name: "H5", re: /^(#####\s+)(.*)(\s*)$/, sub: '<span font_weight="bold" size="90%">$2</span>' },
    ],
    styles: [
        { name: "BOLD", re: /(\*\*)(\S[\s\S]*?\S)(\*\*)/g, sub: "<b>$2</b>" },
        { name: "UND", re: /(__)(\S[\s\S]*?\S)(__)/g, sub: "<u>$2</u>" },
        { name: "EMPH", re: /\*(\S.*?\S)\*/g, sub: "<i>$1</i>" },
        // { name: 'EMPH', re: /_(\S.*?\S)_/g, sub: "<i>$1</i>" },
        {
            name: "HEXCOLOR",
            re: /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g,
            sub: `<span bgcolor="#$1" fgcolor="#000000" font_family="${monospaceFonts}">#$1</span>`,
        },
        {
            name: "INLCODE",
            re: /(`)([^`]*)(`)/g,
            sub: `<span font_weight="bold" font_family="${monospaceFonts}">$2</span>`,
        },
        // { name: 'UND', re: /(__|\*\*)(\S[\s\S]*?\S)(__|\*\*)/g, sub: "<u>$2</u>" },
    ],
};

const replaceCategory = (text, replaces) => {
    for (const type of replaces) text = text.replace(type.re, type.sub);
    return text;
};

const replaceAll = text => {
    for (const category of Object.values(replacements)) text = replaceCategory(text, category);
    return text;
};

// Main function
export default text =>
    text
        .split("\n")
        .map(replaceAll)
        .map(line => line.trimEnd())
        .join("\n");

export const markdownTest = `# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
1. yes
2. no
127. well
- Bulletpoint starting with minus
* Bulletpoint starting with asterisk
---
- __Underline__ __ No underline __
- **Bold** ** No bold **
- _Italics1_ *Italics2* _ No Italics _
- A color: #D6BAFF
- nvidia green: #7ABB08
  - sub-item
\`\`\`javascript
// A code block!
myArray = [23, 123, 43, 54, '6969'];
console.log('uwu');
\`\`\`
- Random instruction thing
  - To update arch lincox, run \`sudo pacman -Syu\`
\`\`\`tex
\\frac{d}{dx} \\left( \\frac{x-438}{x^2+23x-7} \\right) = \\frac{-x^2 + 869}{(x^2+23x-7)^2} hmmmmmm \\frac{d}{dx} \\left( \\frac{x-438}{x^2+23x-7} \\right) = \\frac{-x^2 + 869}{(x^2+23x-7)^2}
\`\`\`
`;
