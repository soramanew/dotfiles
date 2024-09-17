function fish_greeting
    sleep .1
    hostnamectl hostname | figlet -tcf chiseled
    echo
    fortune -s | cowsay -r | figlet -tcf term
end
