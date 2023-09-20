import { ChatInputCommandInteraction } from "discord.js";
import { CommandData } from "../../../lib/types.ts";
import { ensureOwner, ensureTCN } from "../../../lib/permissions.ts";
import api from "../../../lib/api.ts";

export const command: CommandData = {
    key: "list",
    description: "list this server's autostaff entries",
};

export default async function (cmd: ChatInputCommandInteraction) {
    await cmd.deferReply({ ephemeral: true });
    await ensureTCN(cmd);
    await ensureOwner(cmd);

    const entries: Record<string, string[]> = await api(`GET /autostaff/${cmd.guildId}`);

    return (
        Object.entries(entries)
            .filter(([watch]) => cmd.guild!.roles.cache.has(watch))
            .map(([watch, roles]) => `<@&${watch}>: staff${roles.map((role) => ` + \`${role}\``).join("")}`)
            .join("\n") || "This server has no autostaff roles."
    );
}
