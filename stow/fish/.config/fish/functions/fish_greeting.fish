function fish_greeting
sleep .1
hostnamectl hostname | figlet -tcf chiseled
echo
cowfortune | figlet -tcf term
end
