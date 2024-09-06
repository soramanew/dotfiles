-- Same as cycle pause but also restart if eof reached
local function cycle_pause()
    if mp.get_property("eof-reached") == "yes" then
        mp.command("no-osd seek 0 absolute")
    end
    mp.command("cycle pause")
end

-- Make available to commands
mp.add_key_binding(nil, "cycle-pause", cycle_pause)

-- Reset on start if at end
mp.register_event("file-loaded", function()
    if tostring(mp.get_property_number("percent-pos")) == "100" then
        mp.command("no-osd seek 0 absolute")
    end
    mp.command("set pause no")
end)
