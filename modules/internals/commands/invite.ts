import { ChatInputCommandInteraction } from "discord.js";
import { CommandData } from "../../../lib/types.ts";
import { ensureObserver } from "../../../lib/permissions.ts";
import { channels } from "../../../lib/bot.ts";

export const command: CommandData = { key: "invite", description: "generate a one-week one-use invite" };

export default async function (cmd: ChatInputCommandInteraction) {
    await ensureObserver(cmd);

    const invite = await cmd.guild!.invites.create(Bun.env.LANDING!, { maxAge: 7 * 24 * 60 * 60, maxUses: 1 });
    await cmd.reply({ content: invite.url, ephemeral: true });

    await channels.BOT_LOGS.send(`${cmd.user} created a one-week one-use invite using \`/internals invite\`.`);
}
