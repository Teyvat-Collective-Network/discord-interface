import { StringSelectMenuInteraction } from "discord.js";
import { applyVote } from "../../../../lib/polls.ts";

export default async function (menu: StringSelectMenuInteraction, id: string) {
    return await applyVote(menu, id, { selected: menu.values });
}
