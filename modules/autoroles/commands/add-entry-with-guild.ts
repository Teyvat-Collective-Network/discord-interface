import { ApplicationCommandOptionType, AutocompleteInteraction, ChatInputCommandInteraction, Role } from "discord.js";
import api from "../../../lib/api.ts";
import { syncAutoroles } from "../../../lib/autoroles.ts";
import { ensureOwner, ensureTCN } from "../../../lib/permissions.ts";
import { CommandData } from "../../../lib/types.ts";

export const command: CommandData = {
    group: "add",
    key: "tcn-guild",
    description: "add an autorole synchronization from a TCN guild to a Discord role",
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: "source",
            description: "the TCN guild to watch",
            required: true,
            autocomplete: true,
        },
        {
            type: ApplicationCommandOptionType.Role,
            name: "target",
            description: "the Discord role to assign",
            required: true,
        },
        {
            type: ApplicationCommandOptionType.String,
            name: "role",
            description: "the TCN role to filter by",
            autocomplete: true,
        },
    ],
};

export async function autocomplete(cmd: AutocompleteInteraction, query: string) {
    await ensureTCN(cmd);
    await ensureOwner(cmd);

    query = query.toLowerCase();

    if (cmd.options.getFocused(true).name === "source") {
        const guilds: { id: string; name: string }[] = await api(`GET /guilds`);
        return guilds.filter(({ name }) => name.toLowerCase().startsWith(query)).map(({ id, name }) => ({ name, value: id }));
    } else {
        const roles: { id: string; assignment: string }[] = await api(`GET /roles`);

        return roles
            .filter(({ assignment }) => ["pseudo", "guild", "all"].includes(assignment))
            .map(({ id }) => id)
            .filter((id) => id.startsWith(query));
    }
}

export default async function (cmd: ChatInputCommandInteraction, source: string, target: Role, role?: string) {
    await cmd.deferReply({ ephemeral: true });
    await ensureTCN(cmd);
    await ensureOwner(cmd);

    const req = await api(`!PUT /guild-autoroles/${cmd.guildId}/${source}/${target.id}`, role ? { role } : {});
    if (!req.ok) throw (await req.json()).message;

    syncAutoroles(cmd.guild!);

    const guild = await api(`GET /guilds/${source}`);
    return `Members who are staff in ${guild.name}${role ? ` with the TCN role \`${role}\`` : ""} will now automatically receive ${target}.`;
}
