import { ApplicationCommandOptionType, Channel, ChannelType, ChatInputCommandInteraction } from "discord.js";
import { CommandData } from "../../../lib/types.ts";
import { ensureOwner, ensureTCN } from "../../../lib/permissions.ts";
import api from "../../../lib/api.ts";

export const command: CommandData = {
    group: "logs",
    key: "add",
    description: "add a banshare logging channel",
    options: [
        {
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread],
            name: "channel",
            description: "the channel to add as a logging channel",
            required: true,
        },
    ],
};

export default async function (cmd: ChatInputCommandInteraction, channel: Channel) {
    await cmd.deferReply({ ephemeral: true });
    await ensureTCN(cmd);
    await ensureOwner(cmd);

    await api(`PUT /banshares/${cmd.guildId}/logs`, { mode: "add", channel: channel.id });
    return `Added ${channel} as a banshare logging channel.`;
}
