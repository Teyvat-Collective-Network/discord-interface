import { ButtonInteraction, ComponentType, TextInputStyle } from "discord.js";
import { ensureObserver } from "../../../lib/permissions.ts";

export default async function (button: ButtonInteraction) {
    await ensureObserver(button);

    button.showModal({
        title: "Rescind Banshare",
        customId: ":banshares/confirm-rescind",
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.TextInput,
                        style: TextInputStyle.Paragraph,
                        customId: "explanation",
                        label: "Explanation",
                        maxLength: 1800,
                        required: true,
                        placeholder: "Why is this banshare being rescinded and why was it published initially?",
                    },
                ],
            },
        ],
    });
}
