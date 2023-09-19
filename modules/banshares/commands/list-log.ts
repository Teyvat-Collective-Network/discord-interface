import { Channel, ChatInputCommandInteraction } from "discord.js";
import api from "../../../lib/api.ts";
import { ensureOwner, ensureTCN } from "../../../lib/permissions.ts";
import { CommandData } from "../../../lib/types.ts";

export const command: CommandData = {
    group: "logs",
    key: "list",
    description: "list banshare logging channels",
};

export default async function (cmd: ChatInputCommandInteraction) {
    await cmd.deferReply({ ephemeral: true });
    await ensureTCN(cmd);
    await ensureOwner(cmd);

    return (
        (await api(`GET /banshares/${cmd.guildId}/logs`))
            .map((id: string) => cmd.guild!.channels.cache.get(id))
            .filter((x?: Channel) => x)
            .join(" ") || "This server has no logging channels."
    );
}
