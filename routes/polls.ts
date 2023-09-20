import { channels } from "../lib/bot.js";
import { displayPoll } from "../lib/polls.js";
import { RouteMap } from "../lib/types.js";

export default {
    async "POST /poll"({ body }) {
        const { id } = await channels.VOTE_HERE.send(await displayPoll(body));
        return { message: id };
    },
    async "PUT /poll"({ body }) {
        try {
            const message = await channels.VOTE_HERE.messages.fetch(body.message);
            await message.edit(await displayPoll(body));
            return { message: message.id };
        } catch {
            const { id } = await channels.VOTE_HERE.send(await displayPoll(body));
            return { message: id };
        }
    },
    async "DELETE /poll/_"({ params: [id] }) {
        try {
            const message = await channels.VOTE_HERE.messages.fetch(id);
            await message.delete();
        } catch {
            throw 404;
        }
    },
} as RouteMap;
