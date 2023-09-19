import { ButtonInteraction } from "discord.js";
import api from "../../../../lib/api.ts";
import { displaySettings } from "../../../../lib/banshares.ts";
import { ensureOwner, ensureTCN } from "../../../../lib/permissions.ts";

export default async function (button: ButtonInteraction, key: string, set: string) {
    await button.deferUpdate();
    await ensureTCN(button);
    await ensureOwner(button);

    return displaySettings(await api(`PATCH /banshares/${button.guildId}/settings`, { [key]: set === "on" }));
}
