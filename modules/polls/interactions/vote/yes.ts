import { ButtonInteraction } from "discord.js";
import { applyVote } from "../../../../lib/polls.ts";

export default async function (button: ButtonInteraction, id: string) {
    return await applyVote(button, id, { yes: true });
}
