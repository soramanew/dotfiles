function output -a text
    set_color cyan
    # Pass arguments other than text to echo
    echo $argv[2..] -- ":: $text"
    set_color normal
end

function push -a from to
    if [ ! -d $to ] || ! diff -r $from $to >/dev/null
        output "$to differs from $from. Pushing changes..."
        [ -d $to ] && rm -rf $to
        cp -r $from $to
    else
        output "No changes between $to and $from. Ignoring."
    end
end

function sudo-push -a from to
    if [ ! -d $to ] || ! diff -r $from $to >/dev/null
        output "$to differs from $from. Pushing changes using root..."
        [ -d $to ] && sudo rm -rf $to
        sudo cp -r $from $to
    else
        output "No changes between $to and $from. Ignoring."
    end
end
