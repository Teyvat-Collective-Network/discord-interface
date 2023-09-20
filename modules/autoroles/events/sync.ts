import { Events, GuildMember } from "discord.js";
import api from "../../../lib/api.ts";

export const event = Events.GuildMemberUpdate;

export default async function (_: unknown, member: GuildMember) {
    const data: { source: string; target: string; role: string }[] = await api(`GET /autoroles/${member.guild.id}`);
    if (data.length === 0) return;

    const targets = data.map(({ target }) => target);
    const give: string[] = [];

    const user = await api(`GET /users/${member.id}`);

    for (const { source, target, role } of data)
        if (source) {
            if (user.guilds[source]?.staff && (!role || user.guilds[source].roles.includes(role)) && !give.includes(target)) give.push(target);
        } else {
            if (user.roles.includes(role) || (Object.values(user.guilds).some((x: any) => x.roles.includes(role)) && !give.includes(target))) give.push(target);
        }

    const take = targets.filter((x) => !give.includes(x));

    if (member.roles.cache.hasAll(...give) && !member.roles.cache.hasAny(...take)) return;

    await member.roles.set([
        ...new Set([
            ...member.roles.cache
                .toJSON()
                .map((x) => x.id)
                .filter((x) => !take.includes(x)),
            ...give,
        ]),
    ]);
}
