import { ButtonInteraction } from "discord.js";
import { components } from "../../../lib/banshares.ts";
import { ensureObserver } from "../../../lib/permissions.ts";

export default async function (button: ButtonInteraction, severity: string) {
    await ensureObserver(button);

    const embed = button.message.embeds[0].toJSON();
    for (const field of embed.fields ?? []) if (field.name === "Severity") field.value = severity;

    await button.update({ embeds: [embed], components: components(false, severity) });
}
