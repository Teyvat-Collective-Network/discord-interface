import { APIEmbed, ButtonStyle, ComponentType, GuildMember, User } from "discord.js";
import { MessageLike } from "./types.ts";

export function confirm(key: string, user?: User | GuildMember | string): MessageLike {
    let id = "";

    if (user)
        if (typeof user === "string") id = user;
        else id = user.id;

    return {
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        style: ButtonStyle.Success,
                        customId: `:${id}:${key}`,
                        label: "Confirm",
                    },
                    {
                        type: ComponentType.Button,
                        style: ButtonStyle.Danger,
                        customId: `:${id}:globals/cancel`,
                        label: "Cancel",
                    },
                ],
            },
        ],
        ephemeral: true,
    };
}

export function embed(data: APIEmbed) {
    data.color ??= 0x2b2d31;
    return { embeds: [data], files: [], components: [] };
}
