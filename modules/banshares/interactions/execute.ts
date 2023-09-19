import { ButtonInteraction, PermissionFlagsBits } from "discord.js";
import { ensureTCN } from "../../../lib/permissions.ts";
import { confirm } from "../../../lib/responses.ts";

export default async function (button: ButtonInteraction, id: string) {
    await button.deferReply({ ephemeral: true });
    await ensureTCN(button);

    if (!button.memberPermissions?.has(PermissionFlagsBits.BanMembers)) throw "Permission denied (mods only).";

    return confirm(`banshares/confirm-execute:${id}`);
}
