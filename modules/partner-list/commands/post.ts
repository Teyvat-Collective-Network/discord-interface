import { ApplicationCommandOptionType } from "discord.js";
import { CommandData } from "../../../lib/types.ts";
import { getEmbed } from "../../../lib/autosync.ts";

export const command: CommandData = {
    key: "view",
    description: "view the TCN partner embed",
    options: [
        {
            type: ApplicationCommandOptionType.Boolean,
            name: "public",
            description: "if true, show the partner embed publicly",
        },
    ],
};

export default async function (_: unknown, show?: boolean) {
    return { ...(await getEmbed()), ephemeral: !show };
}
