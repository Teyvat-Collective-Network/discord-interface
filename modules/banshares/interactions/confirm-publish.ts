import { ButtonInteraction, ChannelType, MessageCreateOptions, PermissionFlagsBits, User } from "discord.js";
import api from "../../../lib/api.ts";
import { banButton, components, crosspostComponents, executedButton, logExecution } from "../../../lib/banshares.ts";
import bot, { channels } from "../../../lib/bot.ts";
import { greyButton } from "../../../lib/components.ts";
import logger from "../../../lib/logger.ts";
import { ensureObserver } from "../../../lib/permissions.ts";

type output = { channel: string; blockdms?: 0 | 1; nobutton?: 0 | 1; daedalus?: 0 | 1; autoban?: number };

export default async function (button: ButtonInteraction) {
    await button.deferUpdate();
    await ensureObserver(button);

    const message = await button.message.fetchReference();

    const req = await api(`!POST /banshares/${message.id}/publish`);
    if (req.status === 404) throw "That banshare does not seem to exist.";
    if (req.status === 400) throw "That banshare is not pending.";

    await channels.BOT_LOGS.send(`${button.user} published ${message.url}`);

    await button.editReply({
        embeds: [{ title: "Component Triggered", description: "The banshare is being published. You may dismiss this message.", color: 0x2b2d31 }],
        components: [],
    });

    await message.edit({ components: greyButton("Publishing...") });

    const embeds = [message.embeds[0].toJSON()];
    const reason = embeds[0].fields!.find((field) => field.name === "Reason")!.value;
    const severity = embeds[0].fields!.find((field) => field.name === "Severity")!.value;

    const ids = await api(`GET /banshares/${message.id}/ids`);
    const users: Record<string, User | null> = {};

    const crossposts: { guild: string; url: string }[] = [];

    await Promise.all(
        (
            await api(`GET /banshares/outputs`)
        ).map(async ({ channel: id, blockdms, nobutton, daedalus, autoban }: output) => {
            try {
                if (blockdms && severity == "DM") return;

                const channel = await bot.channels.fetch(id);
                if (!channel || !("guild" in channel)) return;

                const me = channel.guild.members.me!;

                switch (channel.type) {
                    case ChannelType.GuildText:
                        if (!channel.permissionsFor(me).has(PermissionFlagsBits.SendMessages | PermissionFlagsBits.EmbedLinks)) return;
                        break;
                    case ChannelType.PublicThread:
                    case ChannelType.PrivateThread:
                        if (!channel.permissionsFor(me).has(PermissionFlagsBits.SendMessagesInThreads | PermissionFlagsBits.EmbedLinks)) return;
                        break;
                    default:
                        return;
                }

                const severityIndex = ["P0", "P1", "P2", "DM"].indexOf(severity);
                const maybeAutoban = ids.length > 0 && autoban && !!(autoban & ((1 << severityIndex) | (1 << (severityIndex + 4))));

                const data: MessageCreateOptions = {
                    embeds,
                    components: [...(maybeAutoban ? greyButton("Autobanning...") : nobutton ? [] : banButton(message.id)), ...crosspostComponents(message.id)],
                };

                const crosspost = await channel.send(data);
                crossposts.push({ guild: channel.guildId, url: crosspost.url });

                if (!maybeAutoban) return;

                let skippable = !(autoban & (1 << (severityIndex + 4)));
                let skip = false;

                for (const id of ids)
                    try {
                        if (!(id in users)) users[id] = await bot.users.fetch(id);

                        if (skippable) {
                            try {
                                await channel.guild.members.fetch(id);
                                skip = true;
                                break;
                            } catch {}
                        }
                    } catch {
                        users[id] = null;
                    }

                if (skip) {
                    await crosspost.edit({ components: [...(nobutton ? [] : banButton(message.id)), ...crosspostComponents(message.id)] });
                    return;
                }

                const banned: User[] = [];
                const failed: User[] = [];
                const invalid: string[] = [];

                for (const [id, user] of Object.entries(users)) {
                    if (!user) {
                        invalid.push(id);
                        continue;
                    }

                    try {
                        await channel.guild.bans.create(user, { reason: `TCN Banshare: ${reason}` });
                        banned.push(user);

                        if (daedalus)
                            try {
                                await fetch(`${Bun.env.DAEDALUS_API}/moderation/history/${channel.guildId}/user/${id}`, {
                                    method: "POST",
                                    headers: { Authorization: `Bearer ${Bun.env.DAEDALUS_TOKEN}`, "Content-Type": "application/json" },
                                    body: JSON.stringify({ type: "ban", duration: 0, origin: crosspost.url, reason: `TCN Banshare: ${reason}` }),
                                });
                            } catch (error) {
                                logger.error(error, "Failed to submit banshare data to the Daedalus API.");
                            }
                    } catch (error) {
                        logger.error(error, `Failed to ban user ${user.id}`);
                        failed.push(user);
                    }
                }

                await logExecution(channel.guildId, crosspost.url, reason, banned, failed, invalid);

                await crosspost.edit({ components: [...executedButton(failed.length > 0), ...crosspostComponents(message.id)] });
            } catch (error) {
                logger.error(error);
            }
        }),
    );

    await api(`PUT /banshares/${message.id}/crossposts`, { crossposts });
    await message.edit({ components: components(true, severity) });
}
