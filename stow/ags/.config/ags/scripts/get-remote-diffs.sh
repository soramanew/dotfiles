#!/bin/bash

cd "$1" || exit

# Fetch changes on remote
git fetch

while read branch; do
    upstream=$(git rev-parse --abbrev-ref $branch@{upstream} 2>/dev/null)
    if [[ $? == 0 ]]; then
        behind=$(git rev-list --count $branch..$upstream)  # On remote
        ahead=$(git rev-list --count $upstream..$branch)  # On local
        echo "$branch $behind $ahead"
    fi
done < <(git for-each-ref --format='%(refname:short)' refs/heads/*)
