import { ButtonInteraction, ButtonStyle, ComponentType, PermissionFlagsBits } from "discord.js";

export default async function (button: ButtonInteraction, id: string) {
    if (!button.memberPermissions?.has(PermissionFlagsBits.BanMembers)) throw "Permission denied (mods only).";

    return {
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.StringSelect,
                        customId: `::banshares/report/presets:${id}`,
                        placeholder: "Report this banshare",
                        minValues: 1,
                        maxValues: 6,
                        options: [
                            "Appears unintended.",
                            "Targeted users are wrong.",
                            "Reason does not warrant a banshare.",
                            "Evidence is insufficient.",
                            "Evidence is forged.",
                            "Severity should be increased.",
                        ].map((x) => ({
                            label: x,
                            value: x,
                        })),
                    },
                ],
            },
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        style: ButtonStyle.Danger,
                        customId: `::banshares/report/custom:${id}`,
                        label: "Report (Custom Reason)",
                    },
                ],
            },
        ],
    };
}
