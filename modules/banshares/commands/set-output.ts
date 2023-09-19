import { ApplicationCommandOptionType, Channel, ChannelType, ChatInputCommandInteraction } from "discord.js";
import api from "../../../lib/api.ts";
import { ensureOwner, ensureTCN } from "../../../lib/permissions.ts";
import { CommandData } from "../../../lib/types.ts";

export const command: CommandData = {
    group: "output",
    key: "set",
    description: "set or remove the output channel for banshares",
    options: [
        {
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread],
            name: "channel",
            description: "the channel to which banshares will be output (leave empty to stop sending banshares)",
        },
    ],
};

export default async function (cmd: ChatInputCommandInteraction, channel?: Channel) {
    await cmd.deferReply({ ephemeral: true });
    await ensureTCN(cmd);
    await ensureOwner(cmd);

    await api(`POST /banshares/${cmd.guildId}/set-output`, { channel: channel?.id });
    return channel ? `Banshares will now be posted to ${channel}.` : "Banshares will no longer be posted in this server.";
}
