import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import { updateAllEmbeds, updateEmbed } from "../../../lib/autosync.ts";
import { ensureObserver, ensureOwner, ensureTCN } from "../../../lib/permissions.ts";
import { CommandData } from "../../../lib/types.ts";
import api from "../../../lib/api.ts";

export const command: CommandData = {
    group: "autosync",
    key: "update",
    description: "call in a manual partner embed update",
    options: [
        {
            type: ApplicationCommandOptionType.Boolean,
            name: "all",
            description: "if true, update in all servers (observer-only)",
        },
    ],
};

export default async function (cmd: ChatInputCommandInteraction, all?: boolean) {
    await cmd.deferReply({ ephemeral: true });

    if (all) {
        await ensureObserver(cmd);
        await updateAllEmbeds();
    } else {
        await ensureTCN(cmd);
        await ensureOwner(cmd);

        const req = await api(`!GET /autosync/${cmd.guildId}`);
        if (!req.ok) throw "This server does not have autosync set up. Use `/partner-list autosync setup`.";

        await updateEmbed(await req.json());
    }

    return "Autosync update complete.";
}
