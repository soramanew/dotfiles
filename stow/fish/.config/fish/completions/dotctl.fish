
cd (dirname (realpath (status filename))) || exit
cd ../../../../../scripts || exit

function recurse_completions
    set -l cmds (find ./(string join '/' $argv) -maxdepth 1 -mindepth 1 -not -name '_*' -exec basename {} .sh \;)
    count $argv >/dev/null && set -l precmds --condition "__fish_seen_subcommand_from $(string join -- ' && __fish_seen_subcommand_from ' $argv)"
    complete -c dotctl -n "not __fish_seen_subcommand_from $cmds" $precmds -a "$cmds"

    for dir in (find ./(string join '/' $argv) -maxdepth 1 -mindepth 1 -type d -exec basename {} \;)
        recurse_completions $argv $dir
    end
end

complete -c dotctl -f
recurse_completions
