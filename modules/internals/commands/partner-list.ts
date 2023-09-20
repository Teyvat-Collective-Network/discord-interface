import { ChatInputCommandInteraction } from "discord.js";
import { CommandData } from "../../../lib/types.ts";
import { ensureObserver } from "../../../lib/permissions.ts";
import api from "../../../lib/api.ts";
import bot from "../../../lib/bot.ts";

export const command: CommandData = { key: "partner-list", description: "generate the long-form partner list" };

export default async function (cmd: ChatInputCommandInteraction) {
    await cmd.deferReply({ ephemeral: true });
    await ensureObserver(cmd);

    await cmd.editReply("Generating, please be patient...");

    const guilds = await api("GET /guilds");
    guilds.sort((x: any, y: any) => x.name.localeCompare(y.name));

    while (guilds.length > 0)
        await cmd.channel!.send({
            embeds: await Promise.all(
                guilds.splice(0, 10).map(async (guild: any) =>
                    ((owner, advisor) => ({
                        title: guild.name,
                        description: `**Owner**: ${owner} (${owner.tag})${advisor ? `\n**Advisor**: ${advisor} (${advisor.tag})` : ""}`,
                        color: 0x2b2d31,
                        url: `https://discord.gg/${guild.invite}`,
                        thumbnail: { url: `${Bun.env.WEBSITE}/files/${guild.mascot}.png` },
                        image: { url: "https://i.imgur.com/U9Wqlug.png" },
                        footer: { text: guild.id },
                    }))(await bot.users.fetch(guild.owner), guild.advisor && (await bot.users.fetch(guild.advisor))),
                ),
            ),
        });

    await cmd.channel!.send("https://embeds.leaf.moe/TCN_partners\n\n**Autosync Guide:** https://teyvatcollective.network/info/partner-list#autosync");
    await cmd.followUp({ content: "Done!", ephemeral: true });
}
