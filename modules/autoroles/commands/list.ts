import { ChatInputCommandInteraction } from "discord.js";
import api from "../../../lib/api.ts";
import { ensureOwner, ensureTCN } from "../../../lib/permissions.ts";
import { embed } from "../../../lib/responses.ts";
import { CommandData } from "../../../lib/types.ts";

export const command: CommandData = {
    key: "list",
    description: "list this server's autorole synchronizations",
};

export default async function (cmd: ChatInputCommandInteraction) {
    await cmd.deferReply({ ephemeral: true });
    await ensureTCN(cmd);
    await ensureOwner(cmd);

    const data = await api(`GET /autoroles/${cmd.guildId}`);
    if (data.length === 0) return "This server has no autorole synchronizations.";

    const lines: string[] = [];
    const names: Record<string, string> = {};

    for (const guild of await api(`GET /guilds`)) names[guild.id] = guild.name;

    for (const { source, target, role } of data) {
        if (!cmd.guild!.roles.cache.has(target)) continue;

        if (source) lines.push(`- **${names[source]}** staff :arrow_right: <@&${target}>${role ? ` (if user has TCN role \`${role}\`)` : ""}`);
        else lines.push(`- \`${role}\` :arrow_right: <@&${target}>`);
    }

    const blocks = [lines.shift()];

    for (const line of lines) if (blocks.at(-1)!.length + line.length + 1 <= 4096) blocks[blocks.length - 1] += `\n${line}`;

    await cmd.editReply(embed({ title: "Autorole Synchronizations", description: blocks.shift() }));
    for (const block of blocks) await cmd.followUp({ ...embed({ title: "Continued...", description: block }), ephemeral: true });
}
