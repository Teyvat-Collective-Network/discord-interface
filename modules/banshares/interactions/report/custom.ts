import { ButtonInteraction, ComponentType, TextInputStyle } from "discord.js";

export default async function (button: ButtonInteraction, id: string) {
    await button.showModal({
        title: "Report Banshare",
        customId: `:banshares/report/confirm:${id}`,
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.TextInput,
                        style: TextInputStyle.Paragraph,
                        customId: "reason",
                        label: "Reason",
                        placeholder: "Explain why you believe this banshare is problematic and/or should be rescinded.",
                        maxLength: 1800,
                        required: true,
                    },
                ],
            },
        ],
    });
}
