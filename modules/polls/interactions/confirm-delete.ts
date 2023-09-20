import { ButtonInteraction } from "discord.js";
import { ensureObserver } from "../../../lib/permissions.ts";
import api from "../../../lib/api.ts";
import { greyButton } from "../../../lib/components.ts";

export default async function (button: ButtonInteraction, id: string) {
    await button.deferUpdate();
    await ensureObserver(button);

    const req = await api(`!DELETE /polls/${id}/di`);

    if (!req.ok) {
        await button.editReply({ embeds: [], components: greyButton("Error") });
        return;
    }

    const message = await button.message.fetchReference();
    await message.delete();

    return "The poll has been deleted.";
}
