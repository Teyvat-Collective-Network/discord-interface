import { ActionRowData, ButtonStyle, ComponentType, MessageActionRowComponentData } from "discord.js";

export function greyButton(label: string): ActionRowData<MessageActionRowComponentData>[] {
    return [
        { type: ComponentType.ActionRow, components: [{ type: ComponentType.Button, style: ButtonStyle.Secondary, customId: "-", label, disabled: true }] },
    ];
}
