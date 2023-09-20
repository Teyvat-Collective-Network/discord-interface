import { ApplicationCommandOptionType, Channel, ChannelType, ChatInputCommandInteraction } from "discord.js";
import api from "../../../lib/api.ts";
import { updateEmbed } from "../../../lib/autosync.ts";
import { ensureOwner, ensureTCN } from "../../../lib/permissions.ts";
import { CommandData } from "../../../lib/types.ts";

export const command: CommandData = {
    group: "autosync",
    key: "setup",
    description: "set up an automatically updating partner embed",
    options: [
        {
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [
                ChannelType.AnnouncementThread,
                ChannelType.GuildAnnouncement,
                ChannelType.GuildText,
                ChannelType.GuildVoice,
                ChannelType.PrivateThread,
                ChannelType.PublicThread,
            ],
            name: "channel",
            description: "the channel to post to (must specify this or webhook)",
        },
        {
            type: ApplicationCommandOptionType.String,
            name: "webhook",
            description: "the webhook to post through (must specify this or channel)",
        },
        {
            type: ApplicationCommandOptionType.Boolean,
            name: "repost",
            description: "if true, repost the embed on update instead of editing it",
        },
    ],
};

export default async function (cmd: ChatInputCommandInteraction, channel?: Channel, webhook?: string, repost?: boolean) {
    await cmd.deferReply({ ephemeral: true });
    await ensureTCN(cmd);
    await ensureOwner(cmd);

    if (!channel && !webhook) throw "Either specify **channel** or **webhook**.";

    await api(`PUT /autosync/${cmd.guildId}`, { channel: channel?.id, webhook, repost: !!repost });
    updateEmbed(await api(`GET /autosync/${cmd.guildId}`));

    return "Embed autosync has been configured in this server. Run this command again to change the configuration. Use `/partner-list autosync update` to manually call in an update. Use `/partner-list autosync stop` to remove the synchronization.";
}
