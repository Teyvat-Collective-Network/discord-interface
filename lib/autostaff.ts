import { Guild } from "discord.js";
import api from "./api.ts";

export async function sync(guild: Guild) {
    const watched: Record<string, string[]> = await api(`GET /autostaff/${guild.id}`);
    const users: Record<string, string[]> = {};

    for (const [watch, roles] of Object.entries(watched)) {
        try {
            const role = await guild.roles.fetch(watch);
            if (!role) continue;

            for (const [, member] of role!.members) {
                users[member.id] ??= [];
                for (const r of roles) if (!users[member.id].includes(r)) users[member.id].push(r);
            }
        } catch {}
    }

    await api(`PUT /set-staff/${guild.id}`, { users });
}
