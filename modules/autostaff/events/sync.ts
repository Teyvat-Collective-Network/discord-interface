import { Events, GuildMember } from "discord.js";
import api from "../../../lib/api.ts";

export const event = Events.GuildMemberUpdate;

export default async function (_: unknown, member: GuildMember) {
    const req = await api(`!GET /guilds/${member.guild.id}`);
    if (!req.ok) return;

    let staff = false;
    let roles: string[] = [];

    const watched: Record<string, string[]> = await api(`GET /autostaff/${member.guild.id}`);

    for (const [watch, add] of Object.entries(watched))
        if (member.roles.cache.has(watch)) {
            staff = true;
            for (const role of add) if (!roles.includes(role)) roles.push(role);
        }

    await api(`PUT /set-staff/${member.guild.id}/${member.id}`, { staff, roles });
}
