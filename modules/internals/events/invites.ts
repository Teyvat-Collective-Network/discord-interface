import { Events, Invite } from "discord.js";
import bot, { channels } from "../../../lib/bot.ts";

export const event = Events.InviteCreate;

const cooldown = new Set<string>();

export default async function (invite: Invite) {
    if (invite.guild?.id !== Bun.env.HQ || invite.inviterId === null || invite.inviterId === bot.user!.id) return;

    const send = !cooldown.has(invite.inviterId);
    cooldown.add(invite.inviterId);
    setTimeout(() => cooldown.delete(invite.inviterId!), 5000);

    await invite.delete();

    if (send)
        await channels.EXEC_MANAGEMENT.send({
            content: `${invite.inviter} Please use \`/internals invite\` to create a one-time invite for adding new council members to HQ.`,
            allowedMentions: { users: [invite.inviterId] },
        });
}
