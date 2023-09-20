import { ButtonInteraction, ComponentType, TextInputStyle } from "discord.js";
import api from "../../../../lib/api.ts";
import bot from "../../../../lib/bot.ts";

export default async function (button: ButtonInteraction, id: string) {
    const poll = await api(`GET /polls/${id}/di`);
    const vote = await api(`GET /polls/${id}/vote/di/${button.user.id}`);

    if (vote.abstain) vote.ranked = vote.countered = [];

    await button.showModal({
        title: "Election Vote Modal",
        customId: `:polls/vote/confirm-election:${id}`,
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.TextInput,
                        style: TextInputStyle.Paragraph,
                        customId: "input",
                        label: poll.candidates.length > poll.seats ? "Rank Candidates (1 = best)" : "Select Favored Candidates",
                        value: poll.candidates
                            .map(
                                (x: string) =>
                                    `${bot.users.cache.get(x)?.tag ?? x}: ${
                                        vote.ranked.includes(x)
                                            ? poll.candidates.length > poll.seats
                                                ? vote.ranked.indexOf(x) + 1
                                                : 1
                                            : vote.countered.includes(x)
                                            ? -1
                                            : vote.missing
                                            ? ""
                                            : 0
                                    }`,
                            )
                            .join("\n"),
                    },
                ],
            },
        ],
    });
}
