import { channels, hq } from "./bot.ts";

export async function sweepInvites() {
    for (const [, invite] of await hq.invites.fetch())
        if (invite.uses && invite.uses > 0)
            try {
                await channels.BOT_LOGS.send(`Deleting invite with code \`${invite.code}\` (${invite.inviter ?? "unknown creator"}) since it has been used.`);
                await invite.delete();
            } catch {}
}
