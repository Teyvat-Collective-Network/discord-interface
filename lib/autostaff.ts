import { Guild, GuildMember } from "discord.js";
import api from "./api.ts";
import bot from "./bot.ts";
import logger from "./logger.ts";

export async function syncAutostaff(guild: Guild) {
    const watched: Record<string, string[]> = await api(`GET /autostaff/${guild.id}`);
    const users: Record<string, string[]> = {};

    for (const [watch, roles] of Object.entries(watched))
        try {
            const role = await guild.roles.fetch(watch);
            if (!role) continue;

            for (const [, member] of role!.members) {
                users[member.id] ??= [];
                for (const r of roles) if (!users[member.id].includes(r)) users[member.id].push(r);
            }
        } catch {}

    await api(`PUT /set-staff/${guild.id}`, { users });
}

export async function syncAllAutostaff() {
    const guilds = await api(`GET /guilds`);

    for (const { id } of guilds) {
        const guild = bot.guilds.cache.get(id);
        if (!guild) continue;

        try {
            await syncAutostaff(guild);
        } catch (error) {
            logger.error(error);
        }
    }
}

export async function syncMemberAutostaff(member: GuildMember) {
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
