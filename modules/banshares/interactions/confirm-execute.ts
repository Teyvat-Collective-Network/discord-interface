import { ButtonInteraction, PermissionFlagsBits, User } from "discord.js";
import api from "../../../lib/api.ts";
import { crosspostComponents, executedButton, logExecution } from "../../../lib/banshares.ts";
import bot from "../../../lib/bot.ts";
import { greyButton } from "../../../lib/components.ts";
import logger from "../../../lib/logger.ts";
import { ensureTCN } from "../../../lib/permissions.ts";

export default async function (button: ButtonInteraction, banshare: string) {
    await button.deferUpdate();
    await ensureTCN(button);

    if (!button.memberPermissions?.has(PermissionFlagsBits.BanMembers)) throw "Permission denied (mods only).";

    const message = await button.message.fetchReference();
    const reason = message.embeds[0].fields.find((field) => field.name === "Reason")!.value;

    const req = await api(`!POST /banshares/execute/${banshare}/${button.guildId}`);
    if (req.status === 404) throw "This banshare seems to not exist in the database.";
    if (req.status === 409) throw "This banshare is already being executed.";

    await button.editReply({
        embeds: [{ title: "Component Triggered", description: "The banshare is being executed. You may dismiss this message.", color: 0x2b2d31 }],
        components: [],
    });

    await message.edit({ components: [...greyButton("Executing..."), ...crosspostComponents(banshare)] });

    const ids = await api(`GET /banshares/${banshare}/ids`);

    const daedalus: boolean = !(await api(`GET /banshares/${button.guildId}/settings`))?.daedalus;

    const banned: User[] = [];
    const failed: User[] = [];
    const invalid: string[] = [];

    for (const id of ids) {
        let user: User;

        try {
            user = await bot.users.fetch(id);
        } catch {
            invalid.push(id);
            continue;
        }

        try {
            await button.guild!.bans.create(user, { reason: `TCN Banshare: ${reason}` });
            banned.push(user);

            if (daedalus)
                try {
                    await fetch(`${Bun.env.DAEDALUS_API}/moderation/history/${button.guildId}/user/${id}`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${Bun.env.DAEDALUS_TOKEN}`, "Content-Type": "application/json" },
                        body: JSON.stringify({ type: "ban", duration: 0, origin: message.url, reason: `TCN Banshare: ${reason}` }),
                    });
                } catch (error) {
                    logger.error(error, "Failed to submit banshare data to the Daedalus API.");
                }
        } catch (error) {
            logger.error(error, `Failed to ban ${user.id}`);
            failed.push(user);
        }
    }

    await logExecution(button.guildId!, message.url, reason, banned, failed, invalid);

    await message.edit({ components: [...executedButton(failed.length > 0), ...crosspostComponents(banshare)] });
}
