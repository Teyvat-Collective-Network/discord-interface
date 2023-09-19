import { Interaction } from "discord.js";

export default async function (interaction: Interaction, data: any) {
    if (!interaction.isRepliable()) return;

    if (interaction.replied) await interaction.followUp(data);
    else if (interaction.deferred) await interaction.editReply(data);
    else await interaction.reply(data);
}
