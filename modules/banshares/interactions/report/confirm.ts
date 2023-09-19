import { ModalSubmitInteraction, PermissionFlagsBits } from "discord.js";
import { channels } from "../../../../lib/bot.ts";

export default async function (modal: ModalSubmitInteraction, id: string) {
    if (!modal.memberPermissions?.has(PermissionFlagsBits.BanMembers)) throw "Permission denied (mods only).";

    await modal.deferUpdate();

    await channels.EXEC_MANAGEMENT.send(
        `${Bun.env.URGENT} ${channels.BANSHARE_LOGS.url}/${id} has been reported by ${modal.user}. Reason:\n\n>>> ${modal.fields.getTextInputValue("reason")}`,
    );

    return "Your report has been submitted and will be reviewed as soon as possible.";
}
