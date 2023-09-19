import { StringSelectMenuInteraction } from "discord.js";
import { channels } from "../../../../lib/bot.ts";

export default async function (menu: StringSelectMenuInteraction, id: string) {
    await menu.deferUpdate();

    await channels.EXEC_MANAGEMENT.send(
        `${Bun.env.URGENT} ${channels.BANSHARE_LOGS.url}/${id} has been reported by ${menu.user}. Reason:\n\n>>> ${menu.values.join(" ")}`,
    );

    return "Your report has been submitted and will be reviewed as soon as possible.";
}
