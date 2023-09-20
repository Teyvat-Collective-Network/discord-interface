import { Message } from "discord.js";
import api from "../lib/api.ts";
import bot, { channels } from "../lib/bot.ts";
import logger from "../lib/logger.ts";
import { getVoters } from "../lib/polls.ts";

async function cycle() {
    api(`POST /polls/close`).catch(() => {});

    let mid = "";

    try {
        const { none, id, message: messageId, restricted } = await api(`POST /polls/dm`);
        if (none) return;
        mid = messageId;

        let message: Message;

        try {
            message = await channels.VOTE_HERE.messages.fetch(mid);
        } catch {
            return;
        }

        const expected = await getVoters(restricted);
        const votes = new Set((await api(`GET /polls/${id}/votes`)).map(({ user }: { user: string }) => user));

        const failed: string[] = [];

        for (const uid of expected) {
            if (votes.has(uid)) continue;

            try {
                const user = await bot.users.fetch(uid);
                await user.send(`You have not voted on ${channels.VOTE_HERE.url}/${mid} yet. Please do so soon!`);
            } catch {
                failed.push(uid);
            }
        }

        if (failed.length > 0)
            await message.reply(
                `${failed.map((x) => `<@${x}>`).join(" ")} You have not voted on ${
                    channels.VOTE_HERE.url
                }/${mid} yet. Please do so soon! (Tip: enable DMs in this server to receive these reminders as a DM instead.)`,
            );
    } catch (error) {
        if (mid)
            await channels.EXEC_MANAGEMENT.send(
                `Alert: sending DM reminders for ${channels.VOTE_HERE.url}/${mid} failed entirely. Check console output for more details.`,
            );

        logger.error(error);
    } finally {
        setTimeout(cycle, 10000);
    }
}

cycle();
