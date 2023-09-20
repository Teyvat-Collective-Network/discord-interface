import { ButtonInteraction } from "discord.js";
import api from "../../../lib/api.ts";
import { updateDashboard } from "../../../lib/banshares.ts";
import { greyButton } from "../../../lib/components.ts";
import { ensureObserver } from "../../../lib/permissions.ts";

export default async function (button: ButtonInteraction) {
    await button.deferUpdate();
    await ensureObserver(button);

    const message = await button.message.fetchReference();

    const req = await api(`!POST /banshares/${message.id}/reject`);
    if (req.status === 404) throw "That banshare does not seem to exist.";
    if (req.status === 400) throw "That banshare is not pending.";

    const embed = message.embeds[0].toJSON();
    embed.fields = embed.fields?.filter((field) => field.name !== "Severity");

    await message.edit({ embeds: [embed], components: greyButton("Rejected") });

    updateDashboard();

    return "Banshare rejected.";
}
