import { StringSelectMenuInteraction } from "discord.js";
import { ensureOwner, ensureTCN } from "../../../../lib/permissions.ts";
import { displaySettings } from "../../../../lib/banshares.ts";
import api from "../../../../lib/api.ts";

export default async function (menu: StringSelectMenuInteraction) {
    await menu.deferUpdate();
    await ensureTCN(menu);
    await ensureOwner(menu);

    return displaySettings(await api(`PATCH /banshares/${menu.guildId}/settings`, { autoban: menu.values.map((x) => parseInt(x)).reduce((x, y) => x + y, 0) }));
}
