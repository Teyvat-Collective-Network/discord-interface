import { ChatInputCommandInteraction } from "discord.js";
import api from "../../../lib/api.ts";
import { ensureOwner, ensureTCN } from "../../../lib/permissions.ts";
import { CommandData } from "../../../lib/types.ts";

export const command: CommandData = {
    group: "autosync",
    key: "stop",
    description: "stop automatically updating the partner embed",
};

export default async function (cmd: ChatInputCommandInteraction) {
    await cmd.deferReply({ ephemeral: true });
    await ensureTCN(cmd);
    await ensureOwner(cmd);

    await api(`DELETE /autosync/${cmd.guildId}`);

    return "Embed autosync has been removed in this server. Use `/partner-list autosync setup` to set it up again.";
}
