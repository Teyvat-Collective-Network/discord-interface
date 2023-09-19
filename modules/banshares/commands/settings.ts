import { ChatInputCommandInteraction } from "discord.js";
import api from "../../../lib/api.ts";
import { displaySettings } from "../../../lib/banshares.ts";
import { ensureOwner, ensureTCN } from "../../../lib/permissions.ts";
import { CommandData } from "../../../lib/types.ts";

export const command: CommandData = {
    key: "settings",
    description: "view and modify this server's banshare settings",
};

export default async function (cmd: ChatInputCommandInteraction) {
    await cmd.deferReply({ ephemeral: true });
    await ensureTCN(cmd);
    await ensureOwner(cmd);

    return displaySettings(await api(`GET /banshares/${cmd.guildId}/settings`));
}
