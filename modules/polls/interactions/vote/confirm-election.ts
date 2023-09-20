import { Colors, ModalSubmitInteraction } from "discord.js";
import api from "../../../../lib/api.ts";
import bot from "../../../../lib/bot.ts";
import { applyVote } from "../../../../lib/polls.ts";

export default async function (modal: ModalSubmitInteraction, id: string) {
    await modal.deferReply({ ephemeral: true });

    const poll = await api(`GET /polls/${id}/di`);

    const error = (message: string) => ({ title: "Invalid Vote", description: message, color: Colors.Red });
    const input = modal.fields.getTextInputValue("input");

    const idMap: Record<string, string> = poll.candidates.reduce(
        (o: Record<string, string>, x: string) => ({ ...o, [x]: x, [bot.users.cache.get(x)?.tag ?? x]: x }),
        {},
    );

    const vote: Record<string, number> = {};

    for (const line of input.split(/\n+/)) {
        const match = line.match(/^(.+)\s*:\s*(-1|\d+)$/);
        if (!match) throw "One or more lines did not match the required format of `tag: vote`.";

        const id = idMap[match[1]];
        if (!id) throw `Did not recognize ${match[1]} as a candidate.`;
        if (id in vote) throw `You ranked ${match[1]} twice.`;

        const num = parseInt(match[2]);
        vote[id] = num;
    }

    console.log(vote);

    return await applyVote(modal, id, { candidates: vote });
}
