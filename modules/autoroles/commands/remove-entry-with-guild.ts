import { ApplicationCommandOptionType, AutocompleteInteraction, ChatInputCommandInteraction, Role } from "discord.js";
import api from "../../../lib/api.ts";
import { syncAutoroles } from "../../../lib/autoroles.ts";
import { ensureOwner, ensureTCN } from "../../../lib/permissions.ts";
import { CommandData } from "../../../lib/types.ts";

export const command: CommandData = {
    group: "remove",
    key: "tcn-guild",
    description: "remove an autorole synchronization from a TCN guild to a Discord role",
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: "source",
            description: "the TCN guild to stop watching",
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

    query = query.toLowerCase();

    const guilds: { id: string; name: string }[] = await api(`GET /guilds`);
    return guilds.filter(({ name }) => name.toLowerCase().startsWith(query)).map(({ id, name }) => ({ name, value: id }));
}

export default async function (cmd: ChatInputCommandInteraction, source: string, target: Role) {
    await cmd.deferReply({ ephemeral: true });
    await ensureTCN(cmd);
    await ensureOwner(cmd);

    const req = await api(`!DELETE /guild-autoroles/${cmd.guildId}/${source}/${target.id}`);
    if (!req.ok) throw (await req.json()).message;

    syncAutoroles(cmd.guild!);

    const guild = await api(`GET /guilds/${source}`);
    return `Members who are staff in ${guild.name} will no longer automatically receive ${target}.`;
}
