import { ModalSubmitInteraction } from "discord.js";
import api from "../../../lib/api.ts";
import bot from "../../../lib/bot.ts";
import { greyButton } from "../../../lib/components.ts";
import { ensureObserver } from "../../../lib/permissions.ts";

export default async function (modal: ModalSubmitInteraction) {
    await modal.deferReply({ ephemeral: true });
    await ensureObserver(modal);

    const message = modal.message!;

    const req = await api(`!POST /banshares/${message.id}/rescind`);
    if (req.status === 404) throw "That banshare does not seem to exist.";
    if (req.status === 400) throw "That banshare is already being rescinded.";

    await modal.editReply({
        embeds: [{ title: "Component Triggered", description: "The banshare is being rescinded. You may dismiss this message.", color: 0x2b2d31 }],
        components: [],
    });

    await message.edit({ components: greyButton("Rescinding...") });

    const explanation = modal.fields.getTextInputValue("explanation");

    await Promise.all(
        (
            await api(`GET /banshares/${message.id}/rescind-outputs`)
        ).map(async ({ url, channel: id }: { url: string; channel: string }) => {
            try {
                const channel = await bot.channels.fetch(id);
                if (!channel?.isTextBased()) return;
                await channel.send(`${url} was rescinded by an observer. The following explanation was given:\n\n>>> ${explanation}`);
            } catch {}
        }),
    );

    await message.edit({ components: greyButton("Rescinded") });
}
