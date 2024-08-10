const Hyprland = await Service.import("hyprland");
import { dispatch } from "../.miscutils/system.js";

function moveClientToWorkspace(address, workspace) {
    dispatch(`movetoworkspacesilent ${workspace},address:${address}`);
}

export function dumpToWorkspace(from, to) {
    if (from == to) return;
    Hyprland.clients.forEach(client => {
        if (client.workspace.id == from) moveClientToWorkspace(client.address, to);
    });
}

export function swapWorkspace(workspaceA, workspaceB) {
    if (workspaceA == workspaceB) return;
    const clientsA = [];
    const clientsB = [];
    Hyprland.clients.forEach(client => {
        if (client.workspace.id == workspaceA) clientsA.push(client.address);
        if (client.workspace.id == workspaceB) clientsB.push(client.address);
    });

    clientsA.forEach(address => moveClientToWorkspace(address, workspaceB));
    clientsB.forEach(address => moveClientToWorkspace(address, workspaceA));
}