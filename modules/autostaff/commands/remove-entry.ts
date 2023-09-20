import { ApplicationCommandOptionType, AutocompleteInteraction, ChatInputCommandInteraction, Role } from "discord.js";
import api from "../../../lib/api.ts";
import { ensureOwner, ensureTCN } from "../../../lib/permissions.ts";
import { CommandData } from "../../../lib/types.ts";
import { syncAutostaff } from "../../../lib/autostaff.ts";

export const command: CommandData = {
    key: "remove",
    description: "remove an autostaff entry",
    options: [
        {
            type: ApplicationCommandOptionType.Role,
            name: "watch",
            description: "the role to stop watching",
            required: true,
        },
        {
            type: ApplicationCommandOptionType.String,
            name: "role",
            description: "if specified, remove this TCN role from the watched role; otherwise remove the watched role entirely",
            autocomplete: true,
        },
    ],
};

export async function autocomplete(cmd: AutocompleteInteraction, query: string) {
    await ensureTCN(cmd);
    await ensureOwner(cmd);

    const roles: { id: string; assignment: string }[] = await api(`GET /roles`);
    query = query.toLowerCase();

    return roles
        .filter(({ assignment }) => ["guild", "all"].includes(assignment))
        .map(({ id }) => id)
        .filter((id) => id.startsWith(query));
}

export default async function (cmd: ChatInputCommandInteraction, watch: Role, role?: string) {
    await cmd.deferReply({ ephemeral: true });
    await ensureTCN(cmd);
    await ensureOwner(cmd);

    const req = await api(`!DELETE /autostaff/${cmd.guildId}/${watch.id}${role ? `/${role}` : ""}`);
    if (!req.ok) throw (await req.json()).message;

    syncAutostaff(cmd.guild!);
    return `Members with ${watch} will no longer ${role ? `receive the \`${role}\`` : "be designated as staff"}.`;
}
