import { Message } from "discord.js";
import api from "./api.ts";
import bot, { channels } from "./bot.ts";
import logger from "./logger.ts";
import { MessageLike } from "./types.ts";

export async function getEmbed(): Promise<MessageLike> {
    return await api(`GET /partner-list`);
}

export async function updateEmbed(config: { guild: string; channel: string; message: string; repost: string; webhook: string }, message?: MessageLike) {
    message ??= await getEmbed();

    try {
        if (config.webhook) {
            if (!config.repost && config.message) {
                try {
                    const req = await fetch(`${config.webhook}/messages/${config.message}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(message),
                    });

                    if (!req.ok) throw 0;

                    return;
                } catch {}
            }

            try {
                const req = await fetch(`${config.webhook}/messages/${config.message}`, { method: "DELETE" });
                if (!req.ok) throw 0;
            } catch {}

            const req = await fetch(`${config.webhook}?wait=true`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(message),
            });

            if (!req.ok) throw await req.json();

            const { id } = await req.json();
            await api(`PUT /autosync/${config.guild}/${id}`);
        } else {
            const channel = await bot.channels.fetch(config.channel);
            if (!channel?.isTextBased()) throw 0;

            let old: Message | null = null;

            try {
                old = await channel.messages.fetch(config.message);
            } catch {}

            if (!config.repost && old) {
                await old.edit(message);
            } else {
                old?.delete();

                const { id } = await channel.send(message);
                await api(`PUT /autosync/${config.guild}/${id}`);
            }
        }
    } catch (error) {
        logger.error(error);
        throw "Something went wrong; check that the bot has the View Channel, Send Messages, and Embed Links permissions in the channel.";
    }
}

export async function updateAllEmbeds() {
    const message = await getEmbed();

    for (const entry of await api(`GET /autosync`)) await updateEmbed(entry, message);

    try {
        (await channels.HUB_PARTNER_LIST.messages.fetch()).mapValues((x) => x.delete());
    } catch {}

    await channels.HUB_PARTNER_LIST.send(message);
}
