import { ApplicationCommandOptionType, AutocompleteInteraction, ChatInputCommandInteraction, Role } from "discord.js";
import api from "../../../lib/api.ts";
import { ensureOwner, ensureTCN } from "../../../lib/permissions.ts";
import { CommandData } from "../../../lib/types.ts";
import { syncAutoroles } from "../../../lib/autoroles.ts";

export const command: CommandData = {
    group: "remove",
    key: "tcn-role",
    description: "remove an autorole synchronization from a TCN role to a Discord role",
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: "role",
            description: "the TCN role to stop watching",
            required: true,
            autocomplete: true,
        },
        {
            type: ApplicationCommandOptionType.Role,
            name: "target",
            description: "the Discord role to stop assigning",
            required: true,
        },
    ],
};

export async function autocomplete(cmd: AutocompleteInteraction, query: string) {
    await ensureTCN(cmd);
    await ensureOwner(cmd);

    const roles: { id: string; assignment: string }[] = await api(`GET /roles`);
    query = query.toLowerCase();

    return roles.map(({ id }) => id).filter((id) => id.startsWith(query));
}

export default async function (cmd: ChatInputCommandInteraction, role: string, target: Role) {
    await cmd.deferReply({ ephemeral: true });
    await ensureTCN(cmd);
    await ensureOwner(cmd);

    const req = await api(`!DELETE /autoroles/${cmd.guildId}/${role}/${target.id}`);
    if (!req.ok) throw (await req.json()).message;

    syncAutoroles(cmd.guild!);

    return `Members with the TCN role \`${role}\` will no longer automatically receive ${target}.`;
}
